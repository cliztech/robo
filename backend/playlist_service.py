from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TrackCandidate(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    artist: str = Field(min_length=1)
    genre: str = Field(min_length=1)
    mood: str = Field(min_length=1)
    energy: int = Field(ge=1, le=10)
    bpm: int = Field(ge=50, le=220)
    duration_seconds: int = Field(ge=30)


class PlaylistGenerationRequest(BaseModel):
    tracks: list[TrackCandidate] = Field(min_length=1)
    desired_count: int = Field(default=12, ge=1, le=100)
    start_hour: int = Field(default=12, ge=0, le=23)
    energy_curve: Literal["build", "steady", "cooldown"] = "build"
    avoid_recent_artist_window: int = Field(default=2, ge=0, le=10)
    preferred_genres: list[str] = Field(default_factory=list)
    max_bpm_delta: int = Field(default=18, ge=0, le=80)
    max_consecutive_same_genre: int = Field(default=2, ge=1, le=10)
    target_duration_seconds: int | None = Field(default=None, ge=30)

    @model_validator(mode="after")
    def validate_desired_count(self) -> "PlaylistGenerationRequest":
        if self.desired_count > len(self.tracks):
            raise ValueError("desired_count cannot exceed available track count")
        return self


class PlaylistEntry(BaseModel):
    track_id: str
    title: str
    artist: str
    genre: str
    mood: str
    energy: int
    bpm: int
    duration_seconds: int
    transition_score: float = Field(ge=0.0, le=1.0)
    selection_reason: str


class PlaylistGenerationResult(BaseModel):
    entries: list[PlaylistEntry]
    average_transition_score: float = Field(ge=0.0, le=1.0)
    energy_flow_score: float = Field(ge=0.0, le=1.0)
    total_duration_seconds: int = Field(ge=0)


class PlaylistResponseEnvelope(BaseModel):
    success: bool
    data: PlaylistGenerationResult | None
    error: "PlaylistGenerationError" | None


class PlaylistGenerationError(BaseModel):
    code: Literal["playlist_constraints_infeasible"]
    message: str
    slot: int = Field(ge=0)
    generated_entries: int = Field(ge=0)
    blocked_constraints: list[Literal["bpm_delta", "genre_run_length", "duration_target"]]
    blocked_counts: dict[Literal["bpm_delta", "genre_run_length", "duration_target"], int]


@dataclass(frozen=True)
class _TimeProfile:
    preferred_genres: tuple[str, ...]
    target_energy: int


@dataclass(slots=True)
class _OptimizedTrack:
    track: TrackCandidate
    genre_lower: str
    mood_lower: str
    artist_norm: str


TIME_OF_DAY_PROFILE: dict[int, _TimeProfile] = {
    0: _TimeProfile(("ambient", "lofi", "chill"), 3),
    1: _TimeProfile(("ambient", "lofi", "chill"), 3),
    2: _TimeProfile(("ambient", "lofi", "chill"), 3),
    3: _TimeProfile(("ambient", "lofi", "chill"), 3),
    4: _TimeProfile(("ambient", "chill", "pop"), 4),
    5: _TimeProfile(("chill", "pop", "indie"), 4),
    6: _TimeProfile(("pop", "indie", "hip-hop"), 5),
    7: _TimeProfile(("pop", "hip-hop", "rock"), 6),
    8: _TimeProfile(("pop", "hip-hop", "rock"), 6),
    9: _TimeProfile(("pop", "indie", "rock"), 6),
    10: _TimeProfile(("pop", "indie", "house"), 6),
    11: _TimeProfile(("house", "dance", "pop"), 7),
    12: _TimeProfile(("house", "dance", "hip-hop"), 7),
    13: _TimeProfile(("house", "dance", "hip-hop"), 7),
    14: _TimeProfile(("house", "edm", "hip-hop"), 8),
    15: _TimeProfile(("house", "edm", "rock"), 8),
    16: _TimeProfile(("edm", "rock", "hip-hop"), 8),
    17: _TimeProfile(("edm", "rock", "hip-hop"), 8),
    18: _TimeProfile(("rock", "hip-hop", "dance"), 7),
    19: _TimeProfile(("rock", "hip-hop", "dance"), 7),
    20: _TimeProfile(("indie", "rock", "synthwave"), 6),
    21: _TimeProfile(("indie", "synthwave", "chill"), 5),
    22: _TimeProfile(("chill", "synthwave", "ambient"), 4),
    23: _TimeProfile(("chill", "ambient", "lofi"), 4),
}


class PlaylistGenerationService:
    @staticmethod
    def _normalize_artist(artist: str) -> str:
        return artist.strip().casefold()

    def generate(self, request: PlaylistGenerationRequest) -> PlaylistGenerationResult:
        # Pre-process tracks into optimized structures (O(N))
        remaining = [
            _OptimizedTrack(
                track=t,
                genre_lower=t.genre.lower(),
                mood_lower=t.mood.lower(),
                artist_norm=self._normalize_artist(t.artist),
            )
            for t in request.tracks
        ]
        output: list[PlaylistEntry] = []
        transition_scores: list[float] = []

        # Pre-compute invariants to avoid re-calculating them in the inner loop (O(N) * K times)
        profile = TIME_OF_DAY_PROFILE[request.start_hour]
        requested_genres = {genre.lower() for genre in request.preferred_genres}

        for slot in range(request.desired_count):
            target_energy = self._target_energy_for_slot(request, slot)
            previous_track = output[-1] if output else None

            # Pre-compute previous track attributes to avoid re-calculating in inner loop
            prev_mood_lower = previous_track.mood.lower() if previous_track else None
            prev_genre_lower = previous_track.genre.lower() if previous_track else None

            recent_artists = {
                self._normalize_artist(entry.artist) for entry in output[-request.avoid_recent_artist_window :]
            }

            hard_filtered: list[_OptimizedTrack] = []
            blocked_counts: dict[Literal["bpm_delta", "genre_run_length", "duration_target"], int] = {
                "bpm_delta": 0,
                "genre_run_length": 0,
                "duration_target": 0,
            }
            for candidate in remaining:
                failed_constraints = self._hard_constraint_failures(request, output, previous_track, candidate)
                if not failed_constraints:
                    hard_filtered.append(candidate)
                    continue
                for failed_constraint in failed_constraints:
                    blocked_counts[failed_constraint] += 1

            if not hard_filtered:
                blocked_constraints = [
                    constraint for constraint, count in blocked_counts.items() if count > 0
                ]
                raise PlaylistConstraintsInfeasibleError(
                    error=PlaylistGenerationError(
                        code="playlist_constraints_infeasible",
                        message=(
                            f"No candidate satisfies hard constraints at slot {slot}; "
                            f"generated {len(output)} of {request.desired_count} requested entries"
                        ),
                        slot=slot,
                        generated_entries=len(output),
                        blocked_constraints=blocked_constraints,
                        blocked_counts=blocked_counts,
                    )
                )

            # Optimized: Use max() instead of sorted() since we only need the top candidate.
            # This reduces complexity from O(N log N) to O(N) per slot.
            chosen = max(
                hard_filtered,
                key=lambda candidate: self._candidate_score(
                    candidate=candidate,
                    previous_track=previous_track,
                    target_energy=target_energy,
                    recent_artists=recent_artists,
                    profile=profile,
                    requested_genres=requested_genres,
                    prev_mood_lower=prev_mood_lower,
                    prev_genre_lower=prev_genre_lower,
                ),
            )

            transition = 1.0 if previous_track is None else self._transition_score(previous_track, chosen, prev_mood_lower, prev_genre_lower)
            transition_scores.append(transition)

            chosen_track = chosen.track
            output.append(
                PlaylistEntry(
                    track_id=chosen_track.id,
                    title=chosen_track.title,
                    artist=chosen_track.artist,
                    genre=chosen_track.genre,
                    mood=chosen_track.mood,
                    energy=chosen_track.energy,
                    bpm=chosen_track.bpm,
                    duration_seconds=chosen_track.duration_seconds,
                    transition_score=round(transition, 3),
                    selection_reason=self._selection_reason(request, target_energy, previous_track, chosen),
                )
            )
            remaining = [track for track in remaining if track.track.id != chosen_track.id]

        return PlaylistGenerationResult(
            entries=output,
            average_transition_score=round(sum(transition_scores) / len(transition_scores), 3),
            energy_flow_score=round(self._energy_flow_score(output, request), 3),
            total_duration_seconds=sum(entry.duration_seconds for entry in output),
        )

    def _hard_constraint_failures(
        self,
        request: PlaylistGenerationRequest,
        output: list[PlaylistEntry],
        previous_track: PlaylistEntry | None,
        candidate: _OptimizedTrack,
    ) -> list[Literal["bpm_delta", "genre_run_length", "duration_target"]]:
        failures: list[Literal["bpm_delta", "genre_run_length", "duration_target"]] = []

        if previous_track is not None and abs(previous_track.bpm - candidate.track.bpm) > request.max_bpm_delta:
            failures.append("bpm_delta")

        if output:
            run_length = 0
            for existing in reversed(output):
                if existing.genre.lower() == candidate.genre_lower:
                    run_length += 1
                else:
                    break
            if run_length >= request.max_consecutive_same_genre:
                failures.append("genre_run_length")

        if request.target_duration_seconds is not None:
            accumulated = sum(entry.duration_seconds for entry in output)
            remaining_slots = request.desired_count - len(output)
            projected = accumulated + candidate.track.duration_seconds
            min_future = (remaining_slots - 1) * 30
            if projected + min_future > request.target_duration_seconds:
                failures.append("duration_target")

        return failures


    def _target_energy_for_slot(self, request: PlaylistGenerationRequest, slot: int) -> int:
        base = TIME_OF_DAY_PROFILE[request.start_hour].target_energy
        if request.desired_count == 1:
            return base

        progress = slot / max(1, request.desired_count - 1)
        if request.energy_curve == "build":
            return min(10, round(base + progress * 2))
        if request.energy_curve == "cooldown":
            return max(1, round(base - progress * 2))
        return base

    def _candidate_score(
        self,
        candidate: _OptimizedTrack,
        previous_track: PlaylistEntry | None,
        target_energy: int,
        recent_artists: set[str],
        profile: _TimeProfile,
        requested_genres: set[str],
        prev_mood_lower: str | None,
        prev_genre_lower: str | None,
    ) -> float:
        score = 0.0
        energy_delta = abs(candidate.track.energy - target_energy)
        score += max(0, 1 - (energy_delta / 10))

        if requested_genres:
            score += 0.5 if candidate.genre_lower in requested_genres else -0.2
        elif candidate.genre_lower in profile.preferred_genres:
            score += 0.35

        if candidate.artist_norm in recent_artists:
            score -= 0.6

        if previous_track is not None:
            score += self._transition_score(previous_track, candidate, prev_mood_lower, prev_genre_lower)

        return score

    def _transition_score(
        self,
        previous: PlaylistEntry,
        current: _OptimizedTrack,
        prev_mood_lower: str | None = None,
        prev_genre_lower: str | None = None,
    ) -> float:
        bpm_gap = abs(previous.bpm - current.track.bpm)
        bpm_score = max(0.0, 1 - (bpm_gap / 35))

        p_mood = prev_mood_lower if prev_mood_lower is not None else previous.mood.lower()
        mood_score = 1.0 if p_mood == current.mood_lower else 0.65

        previous_artist_norm = self._normalize_artist(previous.artist)
        artist_score = 0.0 if previous_artist_norm == current.artist_norm else 1.0

        p_genre = prev_genre_lower if prev_genre_lower is not None else previous.genre.lower()
        genre_score = 1.0 if p_genre == current.genre_lower else 0.75

        return round((bpm_score * 0.35) + (mood_score * 0.25) + (artist_score * 0.25) + (genre_score * 0.15), 3)

    def _selection_reason(
        self,
        request: PlaylistGenerationRequest,
        target_energy: int,
        previous_track: PlaylistEntry | None,
        chosen: _OptimizedTrack,
    ) -> str:
        parts = [f"target_energy={target_energy}"]
        if request.preferred_genres and chosen.genre_lower in {genre.lower() for genre in request.preferred_genres}:
            parts.append("matched_preferred_genre")
        if previous_track is not None:
            parts.append(f"transition={self._transition_score(previous_track, chosen):.2f}")
        return ", ".join(parts)

    def _energy_flow_score(self, entries: list[PlaylistEntry], request: PlaylistGenerationRequest) -> float:
        if len(entries) <= 1:
            return 1.0

        penalties = 0.0
        for idx in range(1, len(entries)):
            delta = entries[idx].energy - entries[idx - 1].energy
            if request.energy_curve == "build" and delta < 0:
                penalties += abs(delta)
            elif request.energy_curve == "cooldown" and delta > 0:
                penalties += abs(delta)
            elif request.energy_curve == "steady" and abs(delta) > 2:
                penalties += abs(delta) - 2

        return max(0.0, round(1 - (penalties / (len(entries) * 4)), 3))


class PlaylistConstraintsInfeasibleError(Exception):
    def __init__(self, error: PlaylistGenerationError) -> None:
        super().__init__(error.message)
        self.error = error

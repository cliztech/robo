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
    error: str | None


@dataclass(frozen=True)
class _TimeProfile:
    preferred_genres: tuple[str, ...]
    target_energy: int


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
    def generate(self, request: PlaylistGenerationRequest) -> PlaylistGenerationResult:
        remaining = request.tracks.copy()
        output: list[PlaylistEntry] = []
        transition_scores: list[float] = []

        for slot in range(request.desired_count):
            target_energy = self._target_energy_for_slot(request, slot)
            previous_track = output[-1] if output else None
            recent_artists = {entry.artist for entry in output[-request.avoid_recent_artist_window :]}

            hard_filtered = [
                candidate
                for candidate in remaining
                if self._passes_hard_constraints(request, output, previous_track, candidate)
            ]
            candidate_pool = hard_filtered if hard_filtered else remaining

            scored_candidates = sorted(
                candidate_pool,
                key=lambda candidate: self._candidate_score(
                    request=request,
                    candidate=candidate,
                    previous_track=previous_track,
                    target_energy=target_energy,
                    recent_artists=recent_artists,
                ),
                reverse=True,
            )
            chosen = scored_candidates[0]

            transition = 1.0 if previous_track is None else self._transition_score(previous_track, chosen)
            transition_scores.append(transition)
            output.append(
                PlaylistEntry(
                    track_id=chosen.id,
                    title=chosen.title,
                    artist=chosen.artist,
                    genre=chosen.genre,
                    mood=chosen.mood,
                    energy=chosen.energy,
                    bpm=chosen.bpm,
                    duration_seconds=chosen.duration_seconds,
                    transition_score=round(transition, 3),
                    selection_reason=self._selection_reason(request, target_energy, previous_track, chosen),
                )
            )
            remaining = [track for track in remaining if track.id != chosen.id]

        return PlaylistGenerationResult(
            entries=output,
            average_transition_score=round(sum(transition_scores) / len(transition_scores), 3),
            energy_flow_score=round(self._energy_flow_score(output, request), 3),
            total_duration_seconds=sum(entry.duration_seconds for entry in output),
        )

    def _passes_hard_constraints(
        self,
        request: PlaylistGenerationRequest,
        output: list[PlaylistEntry],
        previous_track: PlaylistEntry | None,
        candidate: TrackCandidate,
    ) -> bool:
        if previous_track is not None and abs(previous_track.bpm - candidate.bpm) > request.max_bpm_delta:
            return False

        if output:
            run_length = 0
            for existing in reversed(output):
                if existing.genre.lower() == candidate.genre.lower():
                    run_length += 1
                else:
                    break
            if run_length >= request.max_consecutive_same_genre:
                return False

        if request.target_duration_seconds is not None:
            accumulated = sum(entry.duration_seconds for entry in output)
            remaining_slots = request.desired_count - len(output)
            projected = accumulated + candidate.duration_seconds
            min_future = (remaining_slots - 1) * 30
            if projected + min_future > request.target_duration_seconds:
                return False

        return True

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
        request: PlaylistGenerationRequest,
        candidate: TrackCandidate,
        previous_track: PlaylistEntry | None,
        target_energy: int,
        recent_artists: set[str],
    ) -> float:
        profile = TIME_OF_DAY_PROFILE[request.start_hour]
        requested_genres = {genre.lower() for genre in request.preferred_genres}
        track_genre = candidate.genre.lower()

        score = 0.0
        energy_delta = abs(candidate.energy - target_energy)
        score += max(0, 1 - (energy_delta / 10))

        if requested_genres:
            score += 0.5 if track_genre in requested_genres else -0.2
        elif track_genre in profile.preferred_genres:
            score += 0.35

        if candidate.artist in recent_artists:
            score -= 0.6

        if previous_track is not None:
            score += self._transition_score(previous_track, candidate)

        return score

    def _transition_score(self, previous: PlaylistEntry, current: TrackCandidate) -> float:
        bpm_gap = abs(previous.bpm - current.bpm)
        bpm_score = max(0.0, 1 - (bpm_gap / 35))
        mood_score = 1.0 if previous.mood.lower() == current.mood.lower() else 0.65
        artist_score = 0.0 if previous.artist == current.artist else 1.0
        genre_score = 1.0 if previous.genre.lower() == current.genre.lower() else 0.75
        return round((bpm_score * 0.35) + (mood_score * 0.25) + (artist_score * 0.25) + (genre_score * 0.15), 3)

    def _selection_reason(
        self,
        request: PlaylistGenerationRequest,
        target_energy: int,
        previous_track: PlaylistEntry | None,
        chosen: TrackCandidate,
    ) -> str:
        parts = [f"target_energy={target_energy}"]
        if request.preferred_genres and chosen.genre.lower() in {genre.lower() for genre in request.preferred_genres}:
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

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass

from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)


class TrackMetadata(BaseModel):
    title: str = Field(min_length=1)
    artist: str = Field(min_length=1)
    album: str | None = None
    duration_seconds: int = Field(ge=30)
    genre_hint: str | None = None
    year: int | None = Field(default=None, ge=1900, le=2100)


class AudioFeatures(BaseModel):
    bitrate_kbps: int | None = Field(default=None, ge=32, le=320)
    sample_rate_hz: int | None = Field(default=None, ge=8000, le=192000)
    channels: int | None = Field(default=None, ge=1, le=8)


class TrackAnalysisRequest(BaseModel):
    track_id: str = Field(min_length=1)
    metadata: TrackMetadata
    audio_features: AudioFeatures | None = None
    model_version: str = Field(default="track-analysis-v1", min_length=1)
    prompt_profile_version: str = Field(default="prompt-profile-v1", min_length=1)


class TrackAnalysis(BaseModel):
    genre: str
    mood: str
    energy_level: int = Field(ge=1, le=10)
    danceability: int = Field(ge=1, le=10)
    bpm_estimate: int = Field(ge=40, le=220)
    vocal_style: str
    best_for_time: list[str]
    tags: list[str] = Field(default_factory=list)
    confidence_score: float = Field(ge=0.0, le=1.0)
    reasoning: str


class TrackAnalysisResult(BaseModel):
    track_id: str
    analysis: TrackAnalysis


class TrackAnalysisEnvelope(BaseModel):
    success: bool
    data: TrackAnalysisResult | None
    error: str | None


@dataclass(frozen=True)
class _GenreProfile:
    mood: str
    energy: int
    danceability: int
    bpm: int
    tags: tuple[str, ...]


_GENRE_PROFILES: dict[str, _GenreProfile] = {
    "house": _GenreProfile("energetic", 8, 9, 126, ("club", "four_on_the_floor")),
    "edm": _GenreProfile("energetic", 9, 8, 130, ("festival", "drop")),
    "dance": _GenreProfile("uplifting", 8, 9, 124, ("party", "radio_friendly")),
    "hip-hop": _GenreProfile("confident", 7, 7, 94, ("groove", "lyrical")),
    "rock": _GenreProfile("driving", 7, 5, 110, ("guitar", "anthemic")),
    "pop": _GenreProfile("uplifting", 6, 7, 118, ("hooky", "mainstream")),
    "ambient": _GenreProfile("calm", 2, 2, 72, ("textural", "background")),
    "lofi": _GenreProfile("chill", 3, 4, 82, ("study", "soft")),
    "jazz": _GenreProfile("sophisticated", 4, 4, 108, ("improv", "warm")),
}

_DEFAULT_PROFILE = _GenreProfile("balanced", 5, 5, 110, ("general",))


class AnalysisCacheStore:
    def get(self, fingerprint: str) -> TrackAnalysisResult | None:
        raise NotImplementedError

    def set(self, fingerprint: str, result: TrackAnalysisResult) -> None:
        raise NotImplementedError


class InMemoryAnalysisCacheStore(AnalysisCacheStore):
    """Process-local cache store for analysis responses."""

    def __init__(self) -> None:
        self._cache: dict[str, TrackAnalysisResult] = {}

    def get(self, fingerprint: str) -> TrackAnalysisResult | None:
        cached = self._cache.get(fingerprint)
        if cached is None:
            return None
        return cached.model_copy(deep=True)

    def set(self, fingerprint: str, result: TrackAnalysisResult) -> None:
        self._cache[fingerprint] = TrackAnalysisResult.model_validate(result.model_dump(mode="json"))


class TrackAnalysisService:
    def __init__(self, cache_store: AnalysisCacheStore | None = None) -> None:
        self._cache_store = cache_store or InMemoryAnalysisCacheStore()

    def analyze(self, request: TrackAnalysisRequest) -> TrackAnalysisResult:
        fingerprint = self._fingerprint(request)
        cached_result = self._cache_store.get(fingerprint)
        if cached_result is not None:
            self._log_cache_event(event="track_analysis_cache_hit", fingerprint=fingerprint, request=request)
            return cached_result

        self._log_cache_event(event="track_analysis_cache_miss", fingerprint=fingerprint, request=request)
        genre = self._resolve_genre(request.metadata.genre_hint)
        profile = _GENRE_PROFILES.get(genre, _DEFAULT_PROFILE)
        duration = request.metadata.duration_seconds
        title_artist_blob = f"{request.metadata.title} {request.metadata.artist}".lower()

        vocal_style = "instrumental" if any(
            token in title_artist_blob for token in ("instrumental", "mix", "dub")
        ) else "mixed"

        energy_level = self._clamp(profile.energy + self._duration_energy_adjustment(duration), 1, 10)
        danceability = self._clamp(profile.danceability + (1 if "remix" in title_artist_blob else 0), 1, 10)
        bpm_estimate = self._clamp(profile.bpm + self._duration_bpm_adjustment(duration), 40, 220)
        best_for_time = self._best_time_slots(energy_level)

        confidence = self._confidence_score(request, profile, genre)
        reasoning = (
            f"Genre inferred as {genre} from metadata. Duration and title cues adjusted "
            f"energy={energy_level}, danceability={danceability}, bpm={bpm_estimate}."
        )

        analysis = TrackAnalysis(
            genre=genre,
            mood=profile.mood,
            energy_level=energy_level,
            danceability=danceability,
            bpm_estimate=bpm_estimate,
            vocal_style=vocal_style,
            best_for_time=best_for_time,
            tags=list(profile.tags),
            confidence_score=confidence,
            reasoning=reasoning,
        )
        result = TrackAnalysisResult(track_id=request.track_id, analysis=analysis)
        self._cache_store.set(fingerprint, result)
        return result

    @staticmethod
    def _fingerprint(request: TrackAnalysisRequest) -> str:
        stable_payload = {
            "metadata": request.metadata.model_dump(mode="json", exclude_none=True),
            "audio_features": (
                request.audio_features.model_dump(mode="json", exclude_none=True)
                if request.audio_features
                else None
            ),
            "model_version": request.model_version,
            "prompt_profile_version": request.prompt_profile_version,
        }
        serialized = json.dumps(stable_payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @staticmethod
    def _log_cache_event(*, event: str, fingerprint: str, request: TrackAnalysisRequest) -> None:
        logger.info(
            json.dumps(
                {
                    "event": event,
                    "track_id": request.track_id,
                    "fingerprint": fingerprint,
                    "model_version": request.model_version,
                    "prompt_profile_version": request.prompt_profile_version,
                },
                sort_keys=True,
            )
        )

    @staticmethod
    def _resolve_genre(genre_hint: str | None) -> str:
        if not genre_hint:
            return "pop"
        normalized = genre_hint.strip().lower()
        aliases = {
            "electronic": "edm",
            "hip hop": "hip-hop",
            "r&b": "pop",
        }
        return aliases.get(normalized, normalized)

    @staticmethod
    def _duration_energy_adjustment(duration_seconds: int) -> int:
        if duration_seconds < 150:
            return 1
        if duration_seconds > 420:
            return -1
        return 0

    @staticmethod
    def _duration_bpm_adjustment(duration_seconds: int) -> int:
        if duration_seconds < 140:
            return 6
        if duration_seconds > 360:
            return -4
        return 0

    @staticmethod
    def _best_time_slots(energy_level: int) -> list[str]:
        if energy_level >= 8:
            return ["afternoon", "evening"]
        if energy_level <= 3:
            return ["night", "morning"]
        return ["morning", "afternoon", "evening"]

    @staticmethod
    def _confidence_score(
        request: TrackAnalysisRequest,
        profile: _GenreProfile,
        resolved_genre: str,
    ) -> float:
        score = 0.65
        if request.metadata.genre_hint:
            score += 0.1 if resolved_genre in _GENRE_PROFILES else -0.05
        if request.audio_features and request.audio_features.bitrate_kbps:
            score += 0.1 if request.audio_features.bitrate_kbps >= 192 else 0.03
        if request.metadata.duration_seconds >= 120:
            score += 0.08
        if profile is _DEFAULT_PROFILE:
            score -= 0.08
        return round(max(0.0, min(score, 0.95)), 3)

    @staticmethod
    def _clamp(value: int, lower: int, upper: int) -> int:
        return max(lower, min(value, upper))

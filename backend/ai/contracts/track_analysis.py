from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class AnalysisStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class TrackMood(str, Enum):
    ENERGETIC = "energetic"
    UPLIFTING = "uplifting"
    CONFIDENT = "confident"
    DRIVING = "driving"
    CALM = "calm"
    CHILL = "chill"
    SOPHISTICATED = "sophisticated"
    BALANCED = "balanced"


class VocalStyle(str, Enum):
    INSTRUMENTAL = "instrumental"
    MIXED = "mixed"


class TrackMetadata(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    artist: str = Field(min_length=1, max_length=160)
    album: str | None = Field(default=None, max_length=160)
    duration_seconds: int = Field(ge=30, le=1800)
    genre_hint: str | None = Field(default=None, max_length=80)
    year: int | None = Field(default=None, ge=1900, le=2100)


class AudioFeatures(BaseModel):
    bitrate_kbps: int | None = Field(default=None, ge=32, le=320)
    sample_rate_hz: int | None = Field(default=None, ge=8000, le=192000)
    channels: int | None = Field(default=None, ge=1, le=8)
    bpm: int | None = Field(default=None, ge=40, le=220)


class TrackAnalysisRequest(BaseModel):
    track_id: str = Field(min_length=1, max_length=120)
    metadata: TrackMetadata
    audio_features: AudioFeatures | None = None


class TrackAnalysis(BaseModel):
    genre: str
    mood: TrackMood
    energy_level: int = Field(ge=1, le=10)
    danceability: int = Field(ge=1, le=10)
    bpm_estimate: int = Field(ge=40, le=220)
    vocal_style: VocalStyle
    best_for_time: list[str]
    tags: list[str] = Field(default_factory=list)
    confidence_score: float = Field(ge=0.0, le=1.0)
    reasoning: str
    status: AnalysisStatus = AnalysisStatus.SUCCESS


class TrackAnalysisResult(BaseModel):
    track_id: str
    analysis: TrackAnalysis

from __future__ import annotations

import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from backend.ai.contracts.track_analysis import (
    TrackAnalysis,
    TrackAnalysisRequest,
    TrackAnalysisResult,
    TrackMood,
    VocalStyle,
)

logger = logging.getLogger(__name__)


class HostScriptRequest(BaseModel):
    message_type: Literal["intro", "outro", "commentary", "news"]
    prompt: str = Field(min_length=3, max_length=500)
    persona_name: str = Field(min_length=1, max_length=120)
    persona_style: str = Field(min_length=1, max_length=120)
    voice: str = Field(min_length=1, max_length=120)


class HostScriptResult(BaseModel):
    script: str = Field(min_length=1, max_length=800)
    safety_flags: list[str]


class AIResponseEnvelope(BaseModel):
    success: bool
    correlation_id: str
    data: TrackAnalysisResult | HostScriptResult | None
    error: str | None
    latency_ms: int = Field(ge=0)
    cost_usd: float = Field(ge=0)


@dataclass
class _GuardrailPrompts:
    track_analysis: str
    host_script: str




class LegacyAITrackAnalysisRequest(BaseModel):
    """Temporary compatibility input for /api/v1/ai/track-analysis.

    TODO(phase-5-story-P5-05): Remove this adapter after all clients send
    canonical TrackAnalysisRequest payloads with track_id + metadata fields.
    """

    title: str = Field(min_length=1, max_length=160)
    artist: str = Field(min_length=1, max_length=160)
    genre: str = Field(min_length=1, max_length=80)
    bpm: int = Field(ge=50, le=220)
    duration_seconds: int = Field(ge=30, le=1800)
    notes: str = Field(default="", max_length=800)

    def to_canonical(self, correlation_id: str) -> TrackAnalysisRequest:
        return TrackAnalysisRequest(
            track_id=f"legacy-{correlation_id}",
            metadata={
                "title": self.title.strip(),
                "artist": self.artist.strip(),
                "duration_seconds": self.duration_seconds,
                "genre_hint": self.genre.strip(),
            },
            audio_features={"bpm": self.bpm},
        )
PROMPTS = _GuardrailPrompts(
    track_analysis=(
        "You are a broadcast-safe track analysis model. Return compact JSON with fields: "
        "mood, energy_score, talkover_windows_seconds, transition_tags, rationale. "
        "Never include profanity or disallowed content."
    ),
    host_script=(
        "You are an on-air host assistant. Produce concise station-safe copy under 70 words. "
        "No hate speech, no personal data, no investment advice, no explicit content."
    ),
)


class AICircuitBreaker:
    def __init__(self, failure_threshold: int = 3, reset_timeout_seconds: int = 30) -> None:
        self.failure_threshold = failure_threshold
        self.reset_timeout_seconds = reset_timeout_seconds
        self._consecutive_failures = 0
        self._opened_at: float | None = None
        self._lock = threading.Lock()

    def allow(self) -> bool:
        with self._lock:
            if self._opened_at is None:
                return True

            elapsed = time.monotonic() - self._opened_at
            if elapsed >= self.reset_timeout_seconds:
                self._opened_at = None
                self._consecutive_failures = 0
                return True
            return False

    def on_success(self) -> None:
        with self._lock:
            self._consecutive_failures = 0
            self._opened_at = None

    def on_failure(self) -> None:
        with self._lock:
            self._consecutive_failures += 1
            if self._consecutive_failures >= self.failure_threshold:
                self._opened_at = time.monotonic()


class AIServiceError(RuntimeError):
    pass


class AITimeoutError(AIServiceError):
    pass


class AICircuitOpenError(AIServiceError):
    pass


class AIInferenceService:
    def __init__(
        self,
        timeout_seconds: float = 2.0,
        circuit_breaker: AICircuitBreaker | None = None,
    ) -> None:
        self.timeout_seconds = timeout_seconds
        self.circuit_breaker = circuit_breaker or AICircuitBreaker()

    def analyze_track(self, request: TrackAnalysisRequest, correlation_id: str) -> tuple[TrackAnalysisResult, int, float]:
        return self._run_inference("track_analysis", request, correlation_id)

    def generate_host_script(self, request: HostScriptRequest, correlation_id: str) -> tuple[HostScriptResult, int, float]:
        return self._run_inference("host_script", request, correlation_id)

    def _run_inference(self, mode: Literal["track_analysis", "host_script"], request: BaseModel, correlation_id: str):
        if not self.circuit_breaker.allow():
            raise AICircuitOpenError("circuit breaker open")

        started = time.monotonic()
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self._invoke_model, mode, request)
                result = future.result(timeout=self.timeout_seconds)
            self.circuit_breaker.on_success()

            latency_ms = int((time.monotonic() - started) * 1000)
            cost_usd = self._estimate_cost(request)
            self._log_event(
                event="ai_inference_success",
                mode=mode,
                correlation_id=correlation_id,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                failure_reason=None,
            )
            return result, latency_ms, cost_usd
        except TimeoutError as exc:
            self.circuit_breaker.on_failure()
            latency_ms = int((time.monotonic() - started) * 1000)
            self._log_event(
                event="ai_inference_failure",
                mode=mode,
                correlation_id=correlation_id,
                latency_ms=latency_ms,
                cost_usd=0.0,
                failure_reason="timeout",
            )
            raise AITimeoutError("inference timed out") from exc
        except Exception as exc:
            self.circuit_breaker.on_failure()
            latency_ms = int((time.monotonic() - started) * 1000)
            self._log_event(
                event="ai_inference_failure",
                mode=mode,
                correlation_id=correlation_id,
                latency_ms=latency_ms,
                cost_usd=0.0,
                failure_reason=type(exc).__name__,
            )
            raise AIServiceError(str(exc)) from exc

    def _invoke_model(self, mode: Literal["track_analysis", "host_script"], request: BaseModel):
        if mode == "track_analysis":
            payload = request.model_dump()
            metadata = payload["metadata"]
            audio = payload.get("audio_features") or {}
            bpm = audio.get("bpm") or 120
            energy_base = min(10, max(1, round(bpm / 20)))
            mood = TrackMood.CHILL if bpm < 95 else TrackMood.ENERGETIC if bpm > 125 else TrackMood.UPLIFTING
            talkover = [8, max(10, metadata["duration_seconds"] // 3)]
            return TrackAnalysisResult(
                track_id=payload["track_id"],
                analysis=TrackAnalysis(
                    genre=(metadata.get("genre_hint") or "pop").lower(),
                    mood=mood,
                    energy_level=energy_base,
                    danceability=max(1, min(10, energy_base + 1)),
                    bpm_estimate=bpm,
                    vocal_style=VocalStyle.MIXED,
                    best_for_time=["afternoon", "evening"] if energy_base >= 7 else ["morning", "afternoon"],
                    tags=[(metadata.get("genre_hint") or "pop").lower(), mood.value],
                    confidence_score=0.82,
                    reasoning=(
                        f"{PROMPTS.track_analysis[:60]}... talkover_windows_seconds={talkover}"
                    ),
                ),
            )

        req = request.model_dump()
        trimmed = req["prompt"].strip()
        script = (
            f"{req['persona_name']} ({req['persona_style']}): "
            f"{trimmed[:120]}"
        )
        return HostScriptResult(script=script, safety_flags=[])

    def _estimate_cost(self, request: BaseModel) -> float:
        text = json.dumps(request.model_dump(), sort_keys=True)
        est_tokens = max(1, len(text) // 4)
        return round(est_tokens * 0.000002, 6)

    def _log_event(
        self,
        *,
        event: str,
        mode: str,
        correlation_id: str,
        latency_ms: int,
        cost_usd: float,
        failure_reason: str | None,
    ) -> None:
        logger.info(
            json.dumps(
                {
                    "event": event,
                    "mode": mode,
                    "correlation_id": correlation_id,
                    "latency_ms": latency_ms,
                    "cost_usd": cost_usd,
                    "failure_reason": failure_reason,
                },
                sort_keys=True,
            )
        )

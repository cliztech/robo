from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone
from threading import Lock
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status

from backend.ai.contracts.track_analysis import TrackAnalysisRequest
from backend.ai_service import (
    AIInferenceService,
    AIResponseEnvelope,
    AICircuitOpenError,
    AIServiceError,
    HostScriptRequest,
)
from backend.security.auth import verify_api_key
from backend.track_analysis_api import (
    LEGACY_TRACK_ANALYSIS_DEPRECATION,
    LEGACY_TRACK_ANALYSIS_WARNING,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
_service = AIInferenceService()

_LEGACY_ROUTE_SUNSET_WINDOW = timedelta(days=30)
_LEGACY_ROUTE_MIGRATION_LINK = '</api/v1/ai/track-analysis>; rel="successor-version"'


class LegacyAnalyzeTrackTelemetry:
    """In-process telemetry for deprecated route usage."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._usage_count = 0
        self._last_event: dict[str, str | int | None] | None = None

    def record(self, *, caller: str, tenant_id: str | None, phase: str) -> None:
        with self._lock:
            self._usage_count += 1
            self._last_event = {
                "caller": caller,
                "tenant_id": tenant_id,
                "phase": phase,
                "count": self._usage_count,
            }

    def snapshot(self) -> dict[str, str | int | None]:
        with self._lock:
            if self._last_event is None:
                return {"count": self._usage_count, "caller": None, "tenant_id": None, "phase": None}
            return dict(self._last_event)


_legacy_route_telemetry = LegacyAnalyzeTrackTelemetry()



def _resolve_correlation_id(x_correlation_id: str | None) -> str:
    return x_correlation_id or str(uuid.uuid4())


def _api_key_fingerprint(api_key: str) -> str:
    digest = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
    return f"sha256:{digest[:12]}"


def _resolve_legacy_cutoff() -> datetime | None:
    cutoff_raw = os.environ.get("ROBODJ_LEGACY_AI_ROUTE_CUTOFF", "").strip()
    if not cutoff_raw:
        return None

    normalized = cutoff_raw.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid ROBODJ_LEGACY_AI_ROUTE_CUTOFF value; expected ISO-8601 datetime/date.",
        ) from exc

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _legacy_headers(cutoff: datetime) -> dict[str, str]:
    sunset = cutoff.strftime("%a, %d %b %Y %H:%M:%S GMT")
    return {
        "Deprecation": LEGACY_TRACK_ANALYSIS_DEPRECATION,
        "Sunset": sunset,
        "Link": _LEGACY_ROUTE_MIGRATION_LINK,
        "Warning": LEGACY_TRACK_ANALYSIS_WARNING,
    }


def _legacy_phase(now: datetime, cutoff: datetime | None) -> str:
    if cutoff is None:
        return "deprecated"
    if now >= cutoff:
        return "sunset"
    if now >= cutoff - _LEGACY_ROUTE_SUNSET_WINDOW:
        return "nearing_sunset"
    return "deprecated"


def _legacy_gone_detail(cutoff: datetime) -> dict[str, str]:
    return {
        "code": "legacy_route_sunset",
        "message": "Deprecated endpoint removed. Migrate to /api/v1/ai/track-analysis.",
        "migration_target": "/api/v1/ai/track-analysis",
        "cutoff": cutoff.isoformat(),
    }


def get_legacy_analyze_track_telemetry() -> dict[str, str | int | None]:
    """Testing/inspection hook for deprecated-route telemetry."""
    return _legacy_route_telemetry.snapshot()


def _run_track_analysis(request: TrackAnalysisRequest, correlation_id: str) -> AIResponseEnvelope:
    try:
        result, latency_ms, cost_usd, cache_hit, status_value, prompt_profile_version = _service.analyze_track(
            request,
            correlation_id,
        )
    except AICircuitOpenError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return AIResponseEnvelope(
        success=True,
        status=status_value,
        correlation_id=correlation_id,
        data=result,
        error=None,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        cache_hit=cache_hit,
        prompt_profile_version=prompt_profile_version,
    )


@router.post("/track-analysis", response_model=AIResponseEnvelope)
def analyze_track(
    request: TrackAnalysisRequest,
    response: Response,
    _: str = Depends(verify_api_key),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = _resolve_correlation_id(x_correlation_id)
    response.headers["X-Correlation-ID"] = correlation_id
    return _run_track_analysis(request, correlation_id)


@router.post("/analyze-track", response_model=AIResponseEnvelope, deprecated=True)
def analyze_track_compat(
    request: TrackAnalysisRequest,
    response: Response,
    api_key: str = Depends(verify_api_key),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = _resolve_correlation_id(x_correlation_id)
    now = datetime.now(timezone.utc)
    cutoff = _resolve_legacy_cutoff()
    phase = _legacy_phase(now, cutoff)

    _legacy_route_telemetry.record(
        caller=_api_key_fingerprint(api_key),
        tenant_id=x_tenant_id,
        phase=phase,
    )

    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["Deprecation"] = LEGACY_TRACK_ANALYSIS_DEPRECATION
    response.headers["Warning"] = LEGACY_TRACK_ANALYSIS_WARNING

    if cutoff is not None and phase in {"nearing_sunset", "sunset"}:
        for header, value in _legacy_headers(cutoff).items():
            response.headers[header] = value

    if phase == "sunset" and cutoff is not None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=_legacy_gone_detail(cutoff),
            headers=_legacy_headers(cutoff),
        )

    return _run_track_analysis(request, correlation_id)


@router.post("/host-script", response_model=AIResponseEnvelope)
def generate_host_script(
    request: HostScriptRequest,
    response: Response,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = _resolve_correlation_id(x_correlation_id)
    response.headers["X-Correlation-ID"] = correlation_id
    try:
        result, latency_ms, cost_usd, status_value, prompt_profile_version = _service.generate_host_script(
            request,
            correlation_id,
        )
    except AICircuitOpenError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return AIResponseEnvelope(
        success=True,
        status=status_value,
        correlation_id=correlation_id,
        data=result,
        error=None,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        cache_hit=False,
        prompt_profile_version=prompt_profile_version,
    )

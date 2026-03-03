from __future__ import annotations

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



def _resolve_correlation_id(x_correlation_id: str | None) -> str:
    return x_correlation_id or str(uuid.uuid4())


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
    _: str = Depends(verify_api_key),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = _resolve_correlation_id(x_correlation_id)
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["Deprecation"] = LEGACY_TRACK_ANALYSIS_DEPRECATION
    response.headers["Warning"] = LEGACY_TRACK_ANALYSIS_WARNING
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

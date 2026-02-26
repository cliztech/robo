from __future__ import annotations

import uuid

from fastapi import APIRouter, Header, HTTPException, status

from backend.ai_service import (
    AIInferenceService,
    AIResponseEnvelope,
    AICircuitOpenError,
    AIServiceError,
    HostScriptRequest,
    TrackAnalysisRequest,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
_service = AIInferenceService()


@router.post("/track-analysis", response_model=AIResponseEnvelope)
def analyze_track(
    request: TrackAnalysisRequest,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = x_correlation_id or str(uuid.uuid4())
    try:
        result, latency_ms, cost_usd, cache_hit, status_value, prompt_profile_version = _service.analyze_track(request, correlation_id)
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


@router.post("/host-script", response_model=AIResponseEnvelope)
def generate_host_script(
    request: HostScriptRequest,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = x_correlation_id or str(uuid.uuid4())
    try:
        result, latency_ms, cost_usd, status_value, prompt_profile_version = _service.generate_host_script(request, correlation_id)
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

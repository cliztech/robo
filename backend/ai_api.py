from __future__ import annotations

import uuid

from fastapi import APIRouter, Header, HTTPException, status

from backend.ai_service import (
    AIInferenceService,
    AIResponseEnvelope,
    AICircuitOpenError,
    AIServiceError,
    AITimeoutError,
    HostScriptRequest,
    LegacyAITrackAnalysisRequest,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
_service = AIInferenceService()


@router.post("/track-analysis", response_model=AIResponseEnvelope)
def analyze_track(
    request: LegacyAITrackAnalysisRequest,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = x_correlation_id or str(uuid.uuid4())
    try:
        result, latency_ms, cost_usd = _service.analyze_track(request.to_canonical(correlation_id), correlation_id)
    except AICircuitOpenError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AITimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return AIResponseEnvelope(
        success=True,
        correlation_id=correlation_id,
        data=result,
        error=None,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
    )


@router.post("/host-script", response_model=AIResponseEnvelope)
def generate_host_script(
    request: HostScriptRequest,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
) -> AIResponseEnvelope:
    correlation_id = x_correlation_id or str(uuid.uuid4())
    try:
        result, latency_ms, cost_usd = _service.generate_host_script(request, correlation_id)
    except AICircuitOpenError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AITimeoutError as exc:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return AIResponseEnvelope(
        success=True,
        correlation_id=correlation_id,
        data=result,
        error=None,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
    )

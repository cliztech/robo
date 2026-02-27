from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from backend.security.auth import verify_api_key
from backend.track_analysis_service import (
    TrackAnalysisEnvelope,
    TrackAnalysisRequest,
    TrackAnalysisService,
)

router = APIRouter(prefix="/api/v1/ai", tags=["track-analysis"])


_FAILED_STATUS_CODE_BY_EXCEPTION: dict[str, int] = {
    "TimeoutError": 504,
    "AITimeoutError": 504,
    "AICircuitOpenError": 503,
    "CircuitOpenError": 503,
    "AIServiceError": 503,
}


def get_track_analysis_service() -> TrackAnalysisService:
    return TrackAnalysisService()


@router.post("/analyze-track", response_model=TrackAnalysisEnvelope)
def analyze_track(
    request: TrackAnalysisRequest,
    _: str = Depends(verify_api_key),
    service: TrackAnalysisService = Depends(get_track_analysis_service),
) -> TrackAnalysisEnvelope | JSONResponse:
    """Deterministic mapping:
    - 200 + degraded envelope for validation/contract fallback failures.
    - 5xx + failed envelope for timeout/circuit/service failures.
    - 200 + success envelope for normal service responses.
    """

    try:
        result = service.analyze(request)
        return TrackAnalysisEnvelope(status="success", success=True, data=result, error=None)
    except (ValidationError, ValueError, TypeError) as exc:
        return TrackAnalysisEnvelope(status="degraded", success=True, data=None, error=str(exc))
    except (TimeoutError, AITimeoutError) as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=504, content=envelope.model_dump())
    except (AICircuitOpenError, AIServiceError) as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=503, content=envelope.model_dump())
    except Exception as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=500, content=envelope.model_dump())

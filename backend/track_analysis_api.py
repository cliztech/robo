"""Compatibility metadata for legacy track-analysis endpoint.

Canonical endpoint: POST /api/v1/ai/track-analysis
Legacy compatibility endpoint: POST /api/v1/ai/analyze-track
"""

router = APIRouter(prefix="/api/v1/ai", tags=["track-analysis"])


class TrackAnalysisEnvelope(BaseModel):
    success: bool
    data: TrackAnalysisResult | None
    error: str | None
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
    except Exception as exc:  # noqa: BLE001
        status_code = _FAILED_STATUS_CODE_BY_EXCEPTION.get(type(exc), 500)
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=status_code, content=envelope.model_dump())
    except (TimeoutError, AITimeoutError) as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=504, content=envelope.model_dump())
    except (AICircuitOpenError, AIServiceError) as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=503, content=envelope.model_dump())
    except Exception as exc:
        envelope = TrackAnalysisEnvelope(status="failed", success=False, data=None, error=str(exc))
        return JSONResponse(status_code=500, content=envelope.model_dump())
LEGACY_TRACK_ANALYSIS_DEPRECATION = "true"
LEGACY_TRACK_ANALYSIS_WARNING = (
    '299 - "Deprecated endpoint: use /api/v1/ai/track-analysis; '
    '/api/v1/ai/analyze-track will be removed in a future release."'
)

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.ai.contracts.track_analysis import TrackAnalysisRequest, TrackAnalysisResult
from backend.security.auth import verify_api_key
from backend.track_analysis_service import TrackAnalysisService

router = APIRouter(prefix="/api/v1/ai", tags=["track-analysis"])


class TrackAnalysisEnvelope(BaseModel):
    success: bool
    data: TrackAnalysisResult | None
    error: str | None


def get_track_analysis_service() -> TrackAnalysisService:
    return TrackAnalysisService()


@router.post("/analyze-track", response_model=TrackAnalysisEnvelope)
def analyze_track(
    request: TrackAnalysisRequest,
    _: str = Depends(verify_api_key),
    service: TrackAnalysisService = Depends(get_track_analysis_service),
) -> TrackAnalysisEnvelope:
    result = service.analyze(request)
    return TrackAnalysisEnvelope(success=True, data=result, error=None)

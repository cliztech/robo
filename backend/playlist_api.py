from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.playlist_service import (
    PlaylistGenerationRequest,
    PlaylistConstraintsInfeasibleError,
    PlaylistGenerationService,
    PlaylistResponseEnvelope,
)
from backend.security.auth import verify_api_key

router = APIRouter(prefix="/api/v1/ai", tags=["playlist"])


def get_playlist_service() -> PlaylistGenerationService:
    return PlaylistGenerationService()


@router.post("/generate-playlist", response_model=PlaylistResponseEnvelope)
def generate_playlist(
    request: PlaylistGenerationRequest,
    _: str = Depends(verify_api_key),
    service: PlaylistGenerationService = Depends(get_playlist_service),
) -> PlaylistResponseEnvelope:
    try:
        result = service.generate(request)
    except PlaylistConstraintsInfeasibleError as exc:
        envelope = PlaylistResponseEnvelope(success=False, data=None, error=exc.error)
        return JSONResponse(status_code=422, content=envelope.model_dump())

    return PlaylistResponseEnvelope(success=True, data=result, error=None)

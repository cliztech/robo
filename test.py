from fastapi import FastAPI
from backend.playlist_api import router as playlist_router
from backend.ai_api import router as ai_router
from backend.track_analysis_api import router as track_analysis_router

app = FastAPI()
app.include_router(playlist_router)
app.include_router(ai_router)
app.include_router(track_analysis_router)

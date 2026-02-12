from fastapi import FastAPI

from backend.scheduling.api import router as autonomy_policy_router

app = FastAPI(title="RoboDJ Backend Scheduler Services")
app.include_router(autonomy_policy_router)

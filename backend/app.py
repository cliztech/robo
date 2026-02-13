from fastapi import FastAPI

from backend.scheduling.api import router as autonomy_policy_router
from backend.scheduling.scheduler_ui_api import router as scheduler_ui_router

app = FastAPI(title="RoboDJ Backend Scheduler Services")
app.include_router(autonomy_policy_router)
app.include_router(scheduler_ui_router)

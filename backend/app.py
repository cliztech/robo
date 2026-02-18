from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from backend.scheduling.api import router as autonomy_policy_router
from backend.scheduling.scheduler_ui_api import router as scheduler_ui_router
from backend.security.secret_integrity import run_secret_integrity_checks
from backend.status.api import router as status_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    result = run_secret_integrity_checks()
    for alert in result.alerts:
        print(alert, flush=True)

    if not result.ok:
        raise RuntimeError(
            "Startup aborted due to secret integrity check failures. "
            "Resolve alerts and restart RoboDJ."
        )

    yield


app = FastAPI(title="RoboDJ Backend Scheduler Services", lifespan=lifespan)
app.include_router(autonomy_policy_router)
app.include_router(status_router)
app.include_router(scheduler_ui_router)


@app.get("/")
async def root_redirect():
    return RedirectResponse(url="/api/v1/autonomy-policy/control-center")

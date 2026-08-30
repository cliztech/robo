## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-23 - [Subshell exec mitigation]
**Vulnerability:** Unsanitized user input passed to bash -lc inside spawn() can lead to arbitrary code execution (Command Injection).
**Learning:** Using string interpolation with user input in shell subshells is unsafe.
**Prevention:** Always use spawn with an executable string and an array of arguments directly, avoiding shell invocation and string-based commands.

## 2026-07-24 - [Log redaction for CLI args]
**Vulnerability:** Passing a credentials URI (e.g. `icecast://user:pass@host`) as a command-line argument (to `ffmpeg`) exposed the password in plaintext when the application logged the entire arguments array.
**Learning:** Application logs that dump internal process configurations or spawned command arguments are common sources of credential leaks if the arguments include authenticated URIs.
**Prevention:** Sanitize or selectively redact command line arguments that contain credential URIs (such as those starting with `icecast://` or `redis://`) before emitting them to the logging system.

## 2024-08-30 - [Defense in Depth: APIRouter Dependency Enforcement]
**Vulnerability:** Inconsistent enforcement of authentication. Several routers (e.g., AI, playlist, track analysis) relied on applying `Depends(verify_api_key)` individually per route function rather than globally on the `APIRouter`. This creates a security gap where new endpoints added to these routers might accidentally omit the authentication dependency, leading to unauthorized access.
**Learning:** In FastAPI applications, human error in applying decorators or dependencies to individual routes is a common cause of authentication bypass issues.
**Prevention:** Always enforce shared authentication or authorization dependencies at the highest possible level, such as the `APIRouter` instantiation (`dependencies=[Depends(verify_api_key)]`), to ensure all current and future routes in that router are protected by default.

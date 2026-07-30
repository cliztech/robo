## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-23 - [Subshell exec mitigation]
**Vulnerability:** Unsanitized user input passed to bash -lc inside spawn() can lead to arbitrary code execution (Command Injection).
**Learning:** Using string interpolation with user input in shell subshells is unsafe.
**Prevention:** Always use spawn with an executable string and an array of arguments directly, avoiding shell invocation and string-based commands.

## 2026-08-10 - [Missing Auth on Host Script Endpoint]
**Vulnerability:** The `/api/v1/ai/host-script` endpoint was missing the `Depends(verify_api_key)` dependency, making it completely unauthenticated.
**Learning:** Developers can easily forget to include the auth dependency on new routes if it's not applied at the router level.
**Prevention:** Apply `dependencies=[Depends(verify_api_key)]` at the `APIRouter` level when all routes in the file require the same authentication, rather than on each individual route.

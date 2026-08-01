## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-23 - [Subshell exec mitigation]
**Vulnerability:** Unsanitized user input passed to bash -lc inside spawn() can lead to arbitrary code execution (Command Injection).
**Learning:** Using string interpolation with user input in shell subshells is unsafe.
**Prevention:** Always use spawn with an executable string and an array of arguments directly, avoiding shell invocation and string-based commands.

## 2026-08-01 - [Auth Bypass via Missing Route Dependency]
**Vulnerability:** Missing authentication on the `/host-script` sensitive endpoint due to accidental omission of `Depends(verify_api_key)`.
**Learning:** Applying shared dependencies at the individual route level can lead to accidental omission on new endpoints.
**Prevention:** Apply shared dependencies like `dependencies=[Depends(verify_api_key)]` at the `APIRouter` level instead of on individual routes to prevent accidental omission on new endpoints.

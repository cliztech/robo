## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-23 - [Subshell exec mitigation]
**Vulnerability:** Unsanitized user input passed to bash -lc inside spawn() can lead to arbitrary code execution (Command Injection).
**Learning:** Using string interpolation with user input in shell subshells is unsafe.
**Prevention:** Always use spawn with an executable string and an array of arguments directly, avoiding shell invocation and string-based commands.

## 2026-07-27 - [Missing Authentication on AI host-script Endpoint]
**Vulnerability:** The `/host-script` endpoint in `backend/ai_api.py` was missing the `Depends(verify_api_key)` dependency, allowing unauthenticated access.
**Learning:** When adding new endpoints to a router that doesn't enforce authentication at the router level, it is easy to forget to add the authentication dependency to the specific endpoint.
**Prevention:** Enforce authentication at the router level using `dependencies=[Depends(verify_api_key)]` when defining the router, or ensure every endpoint explicitly requires it.

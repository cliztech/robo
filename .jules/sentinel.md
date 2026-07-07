## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-05-25 - [Child process execution refactor]
**Vulnerability:** Shell execution patterns in PlayoutEngine allowed unsanitized input passing into spawn calls.
**Learning:** spawn should not be used with shell invocation because string interpolation into shell commands is prone to issues.
**Prevention:** Use spawn with a direct executable and arguments array, avoiding shell strings and redirection operators. Use direct arguments where possible.

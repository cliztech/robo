## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-26 - [Refactor child process execution]
**Vulnerability:** Shell invocation using `spawn("bash", ["-lc", ...])` with interpolated strings can execute unintended operators.
**Learning:** When executing processes, passing strings via interpolated shells is unsafe.
**Prevention:** Always use direct executable strings and arrays of arguments in `spawn()` calls, completely avoiding sub-shells or shell string evaluation.

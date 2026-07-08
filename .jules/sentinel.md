## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-10-10 - [Child Process Execution Refactor]
**Vulnerability:** Invoking shell processes with dynamic input strings allows unintended execution logic.
**Learning:** Shell invocation via `bash` with dynamic input allows execution of unintended execution logic. Native child_process `spawn` should always execute binaries directly with argument arrays.
**Prevention:** Avoid shell invocation. Use `spawn('executable', ['arg1', 'arg2'])` so inputs are treated strictly as arguments. Use native executable features instead of shell redirections.

## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-10-24 - [Child Process Execution Refactor]
**Vulnerability:** Shell-invoked `spawn("bash")` can misinterpret unescaped characters in inputs like filepaths.
**Learning:** String interpolation of inputs into shell commands is fragile. Node.js `spawn` should use an explicit array of arguments. Shell redirections like `>` can be safely replaced by passing the target path directly to the executable.
**Prevention:** Always use `spawn` with a direct executable string and an array of arguments, avoiding shell invocation.

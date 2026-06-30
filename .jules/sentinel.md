## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2025-02-12 - [Command Injection via subprocess.run]
**Vulnerability:** Use of `shell=True` in `subprocess.run` with unsanitized command inputs can lead to command injection.
**Learning:** In python scripts, command injection via `subprocess.run` should be mitigated by setting `shell=False` and using `shlex.split(command)` to convert string commands into argument lists.
**Prevention:** Avoid `shell=True`. Always use `shell=False` and tokenize string commands properly using `shlex.split`.

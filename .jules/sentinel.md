## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-06-27 - [Subprocess Execution Refactor]
**Vulnerability:** The `run_gate` function utilized a subshell for execution, which can be unsafe when handling dynamically configured strings.
**Learning:** Depending on subshell interpretation allows shell meta-characters to be evaluated, creating unintended execution paths.
**Prevention:** Use `shlex.split()` to safely parse command strings into an arguments list and disable subshell execution in `subprocess.run()` calls.

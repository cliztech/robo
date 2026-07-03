## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-05-26 - [Update shell execution pattern]
**Vulnerability:** The `evaluate_release_gates.py` script executes subprocesses with shell features enabled.
**Learning:** Relying on shell interpretation can lead to unintended behaviors if inputs are altered.
**Prevention:** Use direct execution and safely split strings using `shlex.split` or pass lists of arguments directly.

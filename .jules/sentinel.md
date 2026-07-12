## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-10-24 - [Refactor child process execution]
**Vulnerability:** Unsanitized variables concatenated directly into shell commands via `spawn("bash", ["-lc", ...])`.
**Learning:** Shell strings interpolate input directly, exposing underlying shells if the input contains special characters.
**Prevention:** Avoid invoking the shell (`bash -c` or `shell: true`). Use explicit executable paths with a dedicated arguments array to ensure inputs are treated as arguments.

## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-26 - Command Injection in Child Process Execution
**Vulnerability:** User-controlled data (file paths) was interpolated into a raw shell string executing via `spawn("bash", ["-lc", cmd])`, leading to potential command injection.
**Learning:** Shell invocation (like `bash -lc` or `shell: true`) forces string parsing instead of explicit argument lists, bypassing standard OS command injection protections.
**Prevention:** Always spawn the specific executable directly (e.g., `spawn('ffmpeg', ['-i', filepath, ...])`) with an array of arguments, strictly avoiding shell execution.

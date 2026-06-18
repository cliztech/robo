## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-25 - [Command Injection in Audio Playout]
**Vulnerability:** Shell invocation using `spawn("bash", ["-lc", ...])` with unsanitized track metadata (e.g. `t.filepath`) allows arbitrary command execution.
**Learning:** Node.js spawn calls using a shell interpreter open vectors for command injection. Unsanitized data in constructed command strings is dangerous.
**Prevention:** Use direct executable invocation with argument arrays (e.g., `spawn('ffmpeg', ['-i', ...])`) instead of passing raw string commands to a shell.

## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-06-03 - [Command Injection via Node.js Spawn Wrapper]
**Vulnerability:** Node.js `spawn("bash", ["-lc", cmd])` calls were concatenating unsanitized object properties (e.g., `t.filepath`) into shell commands, risking command injection if an attacker controlled the file path.
**Learning:** Shell wrapping built-in Node.js `spawn` bypasses the safety provided by array-based arguments, enabling shell injection when inputs aren't sanitized.
**Prevention:** Always invoke the target binary directly (e.g., `spawn("ffmpeg", [...args])`) and pass untrusted inputs as distinct array elements rather than concatenating them into shell strings. Avoid `bash -c` unless explicitly required and carefully sanitized.

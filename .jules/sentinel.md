## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-05-26 - [Unsafe Shell Invocation in audio-engine]
**Vulnerability:** Track filepaths were directly interpolated into a bash command string used by spawn("bash", ["-lc", ...]), allowing arbitrary code execution if a filename contained shell metacharacters.
**Learning:** Using shell invocation with untrusted inputs bypasses the safety of argument arrays. Furthermore, writing to a named pipe (FIFO) via shell redirection can be securely replaced by passing the FIFO path as a direct argument to ffmpeg with the -y flag.
**Prevention:** Always invoke executables directly with an array of arguments rather than passing string commands to a shell. Pass destination pipes as direct arguments where supported.

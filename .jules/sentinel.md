## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-25 - [Command Injection via Shell Invocation]
**Vulnerability:** Shell invocation using `spawn("bash", ["-lc", ...])` with unsanitized input (`t.filepath`) exposes the service to command injection risks.
**Learning:** Always use direct executable strings and an array of arguments with `spawn` to avoid shell evaluation. When writing to a named pipe with `ffmpeg` in Node.js, pass the FIFO path directly as a command-line argument along with the `-y` flag to avoid shell redirection.
**Prevention:** Ensure `spawn` calls do not invoke a shell and pass arguments as an array.

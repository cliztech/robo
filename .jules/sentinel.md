## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-15 - [Command Injection via child_process.spawn]
**Vulnerability:** Invoking `spawn("bash", ["-lc", cmd])` where `cmd` includes un-sanitized dynamic input strings such as `t.filepath` makes the process susceptible to command injection attacks.
**Learning:** Even using single quotes or string interpolation via shell `> ` redirects in JavaScript templates can easily be broken if a file name or path contains unexpected characters or specifically crafted payloads. Passing paths explicitly inside an array payload entirely mitigates this issue because it doesn't involve parsing spaces and special characters with bash.
**Prevention:** Avoid invoking `bash` shells for simple subprocesses. Instead, invoke the executable directly (e.g. `spawn("ffmpeg", [...])`) and pass arguments explicitly as a structured array rather than evaluating string commands.

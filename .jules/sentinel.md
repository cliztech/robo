## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2025-02-28 - [Command Injection via bash -lc]
**Vulnerability:** Node.js `spawn` was using `bash -lc` to execute string-interpolated shell commands (`spawn("bash", ["-lc", cmd])`) where `cmd` contained unsanitized object properties like file paths (e.g., `t.filepath`). This allowed command injection if an attacker controlled the file path.
**Learning:** Shell evaluation enables powerful but dangerous features like redirects and chaining. When passing arbitrary data into a shell context, escaping is brittle. Using `bash -lc` bypasses Node.js's natural protection against command injection in `spawn`.
**Prevention:** Always use direct executable invocation in `spawn` (e.g., `spawn("ffmpeg", ["-i", filepath, ...])`). Pass dynamic values exclusively as separate array items, and implement stream redirection (like writing to a FIFO) via tool-specific native arguments rather than shell redirects (`>`).

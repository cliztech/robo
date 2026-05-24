## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-25 - [Command Injection in Audio Engine]
**Vulnerability:** The audio engine used `spawn("bash", ["-lc", `ffmpeg ... -i "${t.filepath}" ...`])` allowing potential command injection via crafted `t.filepath`.
**Learning:** Shell redirection (like `> fifoPath`) combined with dynamic input inside a `bash -c` string wrapper defeats input sanitization.
**Prevention:** Avoid shell wrapping entirely. Pass arguments directly to child processes using argument arrays (e.g., `spawn("ffmpeg", ["-i", filepath, ...])`), and use appropriate program flags (like passing the output path directly to `ffmpeg` instead of using shell redirection) or Node.js native streams.

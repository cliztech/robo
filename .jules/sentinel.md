## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-01 - [Command Injection via Shell Execution]
**Vulnerability:** Using `spawn("bash", ["-lc", cmd])` with string interpolation for file paths (e.g., track.filepath and fifoPath) allowed for arbitrary command execution if paths contained shell metacharacters.
**Learning:** Developers often use bash wrappers with string interpolation out of convenience for utilizing shell features like redirection (e.g., `> fifoPath`), but this bypasses the safety guarantees of using array-based arguments in `spawn()`.
**Prevention:** Avoid invoking shells (bash/sh) directly. Always use the array-based arguments in `child_process.spawn()` (e.g., `spawn("ffmpeg", ["-i", file])`) and avoid shell operators like redirection by utilizing the command's native file output features or Node's stdio streams.

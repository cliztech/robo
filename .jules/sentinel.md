## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-06-26 - [Command Injection in Child Process]
**Vulnerability:** Invoking child processes using shell invocation like `spawn("bash", ["-lc", ...])` with untrusted input (e.g. `t.filepath`) exposes the application to command injection.
**Learning:** Shell interpreters process shell metacharacters, allowing arbitrary command execution if variables are unsanitized. Node.js mitigates this when passing arguments directly to the executable.
**Prevention:** Avoid shell invocation (e.g., `bash -c`, or `shell: true`). Use `spawn` with a direct executable string and an array of arguments (e.g., `spawn("ffmpeg", ["-i", t.filepath])`).

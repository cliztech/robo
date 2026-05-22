## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-22 - [Command Injection in Audio Playout]
**Vulnerability:** The `audio-engine` service launched `ffmpeg` and `mkfifo` by wrapping commands in `bash -lc` inside `child_process.spawn`. This allowed variables like `t.filepath` (which might be user-controlled or originate from the database) to be injected as shell metacharacters, leading to arbitrary command execution.
**Learning:** Never wrap commands in `bash` strings when using Node's `spawn`. Always use `spawn(command, [args...])` with a strict array of arguments to bypass shell interpretation entirely.
**Prevention:** In `spawn`, invoke the actual executable (`ffmpeg`, `mkfifo`) directly and let Node.js handle argument passing natively.

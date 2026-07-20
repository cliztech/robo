## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-07-20 - [Shell Invocation Risk in Node.js]
**Vulnerability:** Passing user-controlled variables (`filepath` and `fifoPath`) directly into a shell command string and executing it via `spawn("bash", ["-lc", cmd])` created a command injection risk in the audio engine playout loop.
**Learning:** Shell interpolation in Node.js allows arbitrary command execution if variables contain shell metacharacters. The use of shell redirection for named pipes encouraged using a shell when direct arguments would suffice.
**Prevention:** Avoid invoking a shell with `spawn`. Instead, call the target executable directly and pass arguments as an array, including named pipe paths, bypassing shell parsing entirely.

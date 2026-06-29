## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-06-29 - [Refactor child process execution in Node.js]
**Vulnerability:** Shell evaluations via `spawn("bash", ["-lc", cmd])` with unsanitized inputs like filepaths in `radio-agentic/services/audio-engine/src/playout.ts`.
**Learning:** Shell strings using template literals to construct commands are risky if inputs contain shell metacharacters. Also, writing to FIFOs in Node.js via bash redirection `> "${fifoPath}"` hides the real dependency and blocks the event loop if opened synchronously.
**Prevention:** Always use `spawn` with a direct executable string and an array of arguments (e.g., `spawn('ffmpeg', ['-i', ...])`), strictly avoiding shell invocation. When outputting to a FIFO with ffmpeg, pass the FIFO path directly as the output argument with the `-y` flag to prevent hangs.

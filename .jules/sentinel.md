## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-05-25 - [Command Injection via Insecure `spawn` in PlayoutEngine]
**Vulnerability:** The `audio-engine` service's `PlayoutEngine` (`radio-agentic/services/audio-engine/src/playout.ts`) used `spawn("bash", ["-lc", ...])` to execute `mkfifo` and `ffmpeg` commands. Unsanitized strings (`t.filepath`, `this.fifoPath`) were concatenated directly into the shell string, allowing for arbitrary command execution.
**Learning:** Using a shell to launch child processes is dangerous when integrating external dynamic data. Passing arguments safely directly into standard arguments array bypasses shell interpretation.
**Prevention:** Avoid executing tools inside of `spawn("bash", ...)` or `exec()`. Instead pass arguments securely by using `spawn("tool_name", ["arg1", "arg2"])`.

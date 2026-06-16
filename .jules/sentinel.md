## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-16 - [Command Injection in Audio Engine]
**Vulnerability:** The audio engine playout passed unsanitized track filepaths directly into an `ffmpeg` shell command using `spawn("bash", ["-lc", ...])`, allowing potential command injection.
**Learning:** Using shell execution for child processes is risky when input is not fully controlled. Node.js synchronous writes to a FIFO block the event loop, so the target FIFO path should be passed directly to ffmpeg instead of using shell redirection.
**Prevention:** Avoid invoking a shell (e.g., `bash -lc`). Use array-based arguments with `spawn` and pass the FIFO path directly to ffmpeg with the `-y` flag to overwrite it without hanging.

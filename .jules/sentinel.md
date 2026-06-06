## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-06-06 - [Command Injection via Shell Execution]
**Vulnerability:** Constructing command strings with unsanitized variables (`this.fifoPath` and `t.filepath`) and executing them via a bash subshell (`spawn("bash", ["-lc", cmd])`) allowed for arbitrary command injection in the `audio-engine` service.
**Learning:** Even when building internal string commands for tools like `ffmpeg`, wrapping the execution in `bash -lc` unnecessarily opens the door to shell injection if variables are improperly sanitized.
**Prevention:** Always invoke the target executable directly (e.g., `spawn("ffmpeg", [...])`) and pass variables as discrete array elements rather than concatenating them into a single command string.

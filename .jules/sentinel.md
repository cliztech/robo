## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-30 - [Command Injection via Shell Invocation in Node.js]
**Vulnerability:** Invoking shell commands via `spawn("bash", ["-lc", cmd])` with unsanitized dynamic inputs (like `this.fifoPath` and `t.filepath`) allows arbitrary command execution.
**Learning:** Using a subshell (`bash -c`) bypasses the security benefits of `spawn` array arguments. Any user-controlled input interpolated into the command string becomes a command injection vector.
**Prevention:** Always execute binaries directly (e.g., `spawn("ffmpeg", [...])` or `spawnSync("mkfifo", [...])`) and pass arguments as separate array elements, avoiding shell interpolation entirely.

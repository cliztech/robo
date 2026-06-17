## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-05-25 - [Command Injection via Shell Invocation]
**Vulnerability:** Invoking processes via `spawn('bash', ['-lc', 'ffmpeg ...'])` with string interpolation exposed the application to command injection if paths contained shell metacharacters.
**Learning:** Using a shell to spawn complex commands with dynamically injected variables circumvents argument separation, allowing unintended command execution.
**Prevention:** In Node.js services, mitigate command injection by using `spawn` with a direct executable string and an array of arguments (e.g., `spawn('ffmpeg', ['-i', ...])`), strictly avoiding shell invocations for dynamic commands.

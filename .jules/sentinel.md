## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-26 - [Command Injection via Shell Invocation]
**Vulnerability:** Command injection risk in audio-engine playout loop via unsanitized interpolation of track filepaths and fifo paths into spawn.
**Learning:** Shell strings inherently trust all interpolated strings as safe, leading to arbitrary command execution if an attacker controls parts of the filepath.
**Prevention:** Avoid shell invocations by using spawn with a direct executable string and an array of arguments, allowing the OS to safely escape arguments.

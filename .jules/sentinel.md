## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2024-05-25 - [Command Injection via spawn]
**Vulnerability:** Used string-based shell invocation for child processes, allowing unsanitized input via spawn("bash", ["-c", cmd]) when the command constructed from arbitrary user/file inputs was susceptible to injection.
**Learning:** Node child_process functions (e.g. spawn, exec) can be vulnerable to command injection if input parameters are not sanitized before being placed into shell-evaluated strings.
**Prevention:** Avoid invoking commands via the shell wrapper (bash/sh); instead, pass executable array arguments directly to `spawn` so they are evaluated strictly as arguments rather than executable shell directives.

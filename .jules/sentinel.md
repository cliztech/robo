## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-06-20 - Command Injection in Node.js spawn
**Vulnerability:** A critical command injection vulnerability was found in the audio-engine where spawn("bash", ["-lc", ...]) was used with unvalidated filepaths passed directly into template literals.
**Learning:** Constructing complex shell commands with string interpolation for filepaths exposes services to command injection if an attacker controls the filename.
**Prevention:** Avoid invoking a shell. Always use spawn with a direct executable string and an array of discrete arguments.

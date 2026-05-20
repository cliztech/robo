## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.
## 2026-05-20 - [Command Injection in Release Evaluation]
**Vulnerability:** `subprocess.run` is invoked with `shell=True` and unsanitized commands sourced from a JSON configuration file in `scripts/ci/evaluate_release_gates.py`. This introduces a command injection vulnerability where malicious input in `release_gates.json` could execute arbitrary shell commands.
**Learning:** Even internal configuration files or structured data sources should be treated as untrusted input if they can dictate command execution, especially in automated CI/CD pipelines. Using `shell=True` is dangerous.
**Prevention:** Avoid `shell=True` in `subprocess.run`. Parse the string command into an argument list using `shlex.split()` and use `shell=False` to ensure arguments are passed safely and directly to the executable.

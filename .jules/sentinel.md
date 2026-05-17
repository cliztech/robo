## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-17 - [Command Injection via subprocess.run]
**Vulnerability:** The script `scripts/ci/evaluate_release_gates.py` was using `subprocess.run(command, shell=True)`, executing arbitrary commands derived from an external JSON configuration file (`config/schemas/release_gates.json`).
**Learning:** Using `shell=True` exposes the system to command injection vulnerabilities, especially when executing dynamically read configurations or external inputs, as an attacker could modify the source file to include malicious shell commands (e.g. `&& rm -rf /`).
**Prevention:** In Python, avoid `shell=True` unless absolutely necessary. Use `shell=False` and tokenize the command string securely using `shlex.split(command)` so that the input is passed as an array of arguments, mitigating shell injection entirely.

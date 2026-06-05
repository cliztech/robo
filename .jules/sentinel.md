## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-05 - [Command Injection via subprocess.run shell=True]
**Vulnerability:** The script `scripts/ci/evaluate_release_gates.py` was using `subprocess.run` with `shell=True` to execute commands defined in `config/schemas/release_gates.json`. This allowed for arbitrary command injection if the configuration file was ever modified maliciously or controlled by an attacker.
**Learning:** Even when the command string is sourced from an internal or seemingly trusted configuration file, using `shell=True` presents a significant command injection risk. All external inputs passed to execution contexts must be considered untrusted.
**Prevention:** In Python scripts, command injection via `subprocess.run` should be mitigated by setting `shell=False` and using `shlex.split(command)` to convert string commands into a safe argument list.

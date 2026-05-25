## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-06-25 - [Command Injection via subprocess shell=True]
**Vulnerability:** Use of `shell=True` in `subprocess.run` inside `scripts/ci/evaluate_release_gates.py` allowed arbitrary command execution because the command string originated from an external JSON file (`release_gates.json`). An attacker modifying the JSON configuration could inject commands that would run with the script's privileges.
**Learning:** Command execution using `shell=True` implicitly invokes a system shell, which can parse shell operators (like `;`, `&&`, or `|`), exposing the system to command injection even when inputs might be seen as "internal configuration".
**Prevention:** Avoid `shell=True`. Always parse the command into a list of arguments using `shlex.split()` and pass the list directly to `subprocess.run` with `shell=False`. This ensures that the arguments are passed directly to the `exec()` system call, circumventing the shell's operator interpretation.

## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-25 - [Command Injection via Unsafe Shell Invocation in Node.js]
**Vulnerability:** Invoking system commands via `spawn('bash', ['-lc', \`...\`])` with unvalidated user input (like file paths or IDs) creates a severe command injection vulnerability. An attacker can craft malicious inputs (e.g., `"; rm -rf / #`) that execute arbitrary code on the host.
**Learning:** Shell interpreters evaluate meta-characters and redirects. Relying on them for simple execution tasks is inherently unsafe when handling dynamic data, regardless of string interpolation.
**Prevention:** Always use `spawn('executable', ['arg1', 'arg2'])` to invoke binaries directly, bypassing the shell entirely. Arguments are passed as an array, eliminating injection vectors. Avoid passing shell features like `>` redirects.

## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-23 - [Subshell exec mitigation]
**Vulnerability:** Unsanitized user input passed to bash -lc inside spawn() can lead to arbitrary code execution (Command Injection).
**Learning:** Using string interpolation with user input in shell subshells is unsafe.
**Prevention:** Always use spawn with an executable string and an array of arguments directly, avoiding shell invocation and string-based commands.

## 2026-07-24 - [Log redaction for CLI args]
**Vulnerability:** Passing a credentials URI (e.g. `icecast://user:pass@host`) as a command-line argument (to `ffmpeg`) exposed the password in plaintext when the application logged the entire arguments array.
**Learning:** Application logs that dump internal process configurations or spawned command arguments are common sources of credential leaks if the arguments include authenticated URIs.
**Prevention:** Sanitize or selectively redact command line arguments that contain credential URIs (such as those starting with `icecast://` or `redis://`) before emitting them to the logging system.

## 2026-10-20 - [Bandit SAST B608 False Positive on Parametrized IN Clause]
**Vulnerability:** Bandit flagged an `f-string` used inside `connection.execute` for dynamic SQL query generation as a B608 (hardcoded_sql_expressions) SQL injection risk, despite the parameters being securely bound.
**Learning:** SAST tools often use naive static pattern matching. Bandit warns about any string interpolation directly passed to SQL execution methods, even if it's only injecting innocuous placeholders (like `?,?,?`) for an `IN` clause. Bypassing this requires restructuring the string formatting (e.g., using `.replace()`) prior to the execution call.
**Prevention:** Construct dynamic query strings containing placeholders outside of the execution method call and attach `# nosec B608` to the execution line to silence the false positive while maintaining safe parameterization.

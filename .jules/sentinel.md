## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-23 - [Command Injection in Node.js spawn]
**Vulnerability:** Shell-based invocation of child processes using string interpolation (e.g., `spawn(\"bash\", [\"-lc\", \`ffmpeg ... ${t.filepath} ... > ${this.fifoPath}\`])`) allows an attacker to inject arbitrary commands via malicious file paths or other input variables containing shell metacharacters.
**Learning:** Passing user-controlled variables into a shell string allows shell parsing, escaping, and command injection.
**Prevention:** Use array-based arguments directly with the executable (e.g., `spawn(\"ffmpeg\", [\"-i\", t.filepath, ...])`) to bypass the shell completely. For redirection in ffmpeg to a FIFO, pass the FIFO path directly as the final argument rather than relying on shell redirection (`> path`).

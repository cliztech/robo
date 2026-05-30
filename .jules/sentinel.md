## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-30 - [Command Injection via Subshell Execution]
**Vulnerability:** Invoking a shell (e.g. `spawn("bash", ["-lc", ...])`) and passing dynamically constructed command strings that incorporate unsanitized variables (like file paths) exposes the application to severe command injection vulnerabilities.
**Learning:** File paths (`t.filepath` or `this.fifoPath`) controlled by users or external systems can contain shell metacharacters (`;`, `&`, `|`, etc.) allowing arbitrary commands to be executed with the privileges of the Node process.
**Prevention:** Always spawn the specific executable directly (e.g., `spawn("ffmpeg", ...)` or `spawn("mkfifo", ...)`) and supply arguments as an array rather than interpolating them into a single shell command string. For writing to named pipes in Node.js, pass the FIFO path directly as a command-line argument to ffmpeg rather than using shell redirection.

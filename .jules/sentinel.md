## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-05-26 - [Refactor bash spawn]
**Vulnerability:** Use of `spawn("bash", ["-lc", cmd])` with unsanitized parameters in `radio-agentic/services/audio-engine/src/playout.ts`.
**Learning:** Using shell invocation (`bash -lc`) with dynamically constructed strings (even if partially controlled) is unsafe. `spawn` should be used with a direct executable string and an array of arguments, not by spawning a shell.
**Prevention:** Update child process execution by using `spawn` directly with the target executable (e.g., `spawn("ffmpeg", ["-i", ...])`) or by using native Node.js functionality instead of delegating to a shell.

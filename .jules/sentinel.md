## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2026-07-15 - [Refactor Child Process Execution]
**Vulnerability:** Shell execution pattern in `playout.ts` could allow unintended command evaluation through interpolated file paths.
**Learning:** Using shell invocation for external processes in Node.js bypasses argument escaping. Writing directly to a FIFO using shell redirection (`>`) can be replaced by passing the FIFO path directly to `ffmpeg` with `-y`.
**Prevention:** Always use direct executable strings with an array of arguments instead of shell interpolation.

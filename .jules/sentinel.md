## 2026-05-25 - [DoS via Malformed Cron Config]
**Vulnerability:** Malformed cron strings (e.g., missing fields or invalid tokens) in `schedules.json` caused unhandled `ValueError` in `SchedulerUiService._build_timeline_blocks`, crashing the entire UI state endpoint (DoS).
**Learning:** Pydantic validation on input models (`ScheduleRecord`) is insufficient if internal logic (like `_cron_day_to_name`) performs stricter validation that raises unhandled exceptions. Input validation must be layered: initial structural validation + robust runtime handling for complex parsing logic.
**Prevention:** Wrap complex parsing logic (especially for string formats like cron) in try-except blocks to fail gracefully (log and skip) rather than crashing the service.

## 2024-05-27 - [Uninitialized Client Reference]
**Vulnerability:** An uninitialized Supabase client reference in `src/app/api/ai/batch-analyze/route.ts` caused a ReferenceError, leading to unhandled exceptions and a 500 status rather than proper 401 unauthorized handling.
**Learning:** Variables must be properly initialized before usage, especially for authentication clients, to ensure the application handles unauthorized requests gracefully rather than failing with server errors.
**Prevention:** Ensure all external clients are properly instantiated before being invoked, and verify imports match local variable usage.

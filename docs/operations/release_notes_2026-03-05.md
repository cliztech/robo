# Release Notes — 2026-03-05

## AI API deprecation hardening

- Added structured deprecation telemetry for legacy `POST /api/v1/ai/analyze-track` usage, including:
  - monotonically increasing usage counter,
  - API key fingerprint,
  - optional tenant metadata (`X-Tenant-ID`),
  - deprecation phase classification (`deprecated`, `nearing_sunset`, `sunset`).
- Added cutoff enforcement via `ROBODJ_LEGACY_AI_ROUTE_CUTOFF`.
  - Route now switches to `410 Gone` after cutoff.
- Added migration guidance surfaces for near-sunset and post-sunset behavior:
  - headers: `Link`, `Sunset`, `Deprecation`, `Warning`,
  - error body details for `410` with migration target and cutoff timestamp.
- Added tests covering:
  - normal legacy behavior before cutoff,
  - migration guidance when nearing cutoff,
  - `410 Gone` behavior after cutoff,
  - preserved canonical `/track-analysis` behavior after legacy cutoff.

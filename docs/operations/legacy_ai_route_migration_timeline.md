# Legacy AI `/analyze-track` Migration Timeline

## Scope

This timeline governs deprecation and removal of the legacy route:

- Legacy: `POST /api/v1/ai/analyze-track`
- Canonical: `POST /api/v1/ai/track-analysis`

## Runtime control

- Environment variable: `ROBODJ_LEGACY_AI_ROUTE_CUTOFF`
- Accepted format: ISO-8601 date or datetime (UTC recommended).
- Behavior:
  - Unset: legacy route remains active and returns deprecation warning headers.
  - Within 30 days of cutoff: legacy route remains active and includes migration headers (`Deprecation`, `Sunset`, `Link`, `Warning`).
  - At or after cutoff: legacy route returns `410 Gone` with migration guidance in response body and headers.

## Required client migration

1. Move callers to `POST /api/v1/ai/track-analysis`.
2. Keep honoring `X-Correlation-ID` semantics unchanged.
3. Treat `410` from legacy route as permanent removal and fail over to canonical route.

## Telemetry and rollout checks

- Track legacy usage counter and caller metadata (API key fingerprint and optional `X-Tenant-ID`).
- Validate that legacy route usage trends to zero before setting cutoff.
- Keep rollout dashboards/alerts keyed to `legacy_route_sunset` error code after cutoff.

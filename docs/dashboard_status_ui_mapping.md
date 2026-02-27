# Dashboard Status API → UI Widget Mapping

This spec maps the extended `/api/v1/status/dashboard` contract into React dashboard widgets, following persistent notification center patterns from `REACT_BROWSER_UI_TEAM_BLUEPRINT.md`.

## 1) Service Health Card

**API source:** `service_health`

- `service_health.status`
  - `healthy` → green badge
  - `degraded` → amber badge
  - `offline` → red badge
- `service_health.reason` → subtitle copy with the cause
- `service_health.observed_at` → "Updated X min ago" helper text

## 2) Queue Depth Trend + Threshold Coloring

**API source:** `queue_depth`

- `queue_depth.trend[]` maps to a compact sparkline.
- `queue_depth.thresholds.warning` and `.critical` map to horizontal threshold rules.
- `queue_depth.state` controls chart accent and card border tone:
  - `info` neutral/green
  - `warning` amber
  - `critical` red
- `queue_depth.current_depth` is shown as the primary numeric KPI.

## 3) Last Successful Rotation + Stale Warning

**API source:** `rotation`

- `rotation.last_successful_rotation_at` drives "Last successful rotation" timestamp row.
- `rotation.stale_after_minutes` defines stale timeout text.
- When `rotation.is_stale=true`, render stale warning callout.
- If present, `rotation.stale_reason` is displayed under the warning title.

## 4) Alert Center Panel (Persistent Notification Center)

**API source:** `alert_center` + `/api/v1/status/dashboard/alerts` + `/api/v1/status/dashboard/alerts/{alert_id}/ack`

Patterns aligned to blueprint notification center:

- Persist alert state in a dedicated notifications store (e.g. `features/notifications/notifications.store.ts`).
- Seed severity chips from `alert_center.filters`.
- Render `alert_center.items[]` as stacked notification rows.
- Filters:
  - client-side quick filtering by selected severities
  - optional server-side filtering with `GET /dashboard/alerts?severity=...`
- Acknowledge flow:
  - trigger `POST /dashboard/alerts/{alert_id}/ack`
  - optimistic UI toggle for `acknowledged`
  - resolve with server `acknowledged_at`
- Keep acknowledged alerts visible but visually muted to preserve operator timeline context.

## UI Integration Sequence

1. Fetch `/api/v1/status/dashboard` for initial dashboard hydrate.
2. Normalize into widget view-models:
   - `serviceHealthCardVm`
   - `queueDepthTrendVm`
   - `rotationHealthVm`
   - `notificationCenterVm`
3. Subscribe to polling/refresh and update notification center incrementally.
4. Route acknowledge actions through alert center endpoint so state remains persistent across refreshes.

## Deployment Assumptions (Canonical Integration Path)

This UI uses **Next.js route-handler proxying** as the canonical integration path.

- Browser client calls only same-origin Next.js endpoints:
  - `GET /api/v1/status/dashboard`
  - `GET /api/v1/status/dashboard/alerts?severity=...`
  - `POST /api/v1/status/dashboard/alerts/{alert_id}/ack`
- Route handlers enforce Supabase session auth before proxying.
- Route handlers forward `Authorization: Bearer <access_token>` and `X-User-Id` to the backend status service.
- Backend service base URL is resolved from:
  1. `DASHBOARD_STATUS_BACKEND_URL`
  2. fallback `INTERNAL_API_BASE_URL`
  3. fallback `http://127.0.0.1:5000`
- Non-2xx backend responses are normalized into `{ status, detail, code? }` to keep client-side error handling stable.

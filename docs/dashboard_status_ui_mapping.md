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
- `queue_depth.state` is the primary severity source for chart accent and card border tone:
  - `info` neutral/green
  - `warning` amber
  - `critical` red
- If `queue_depth.state` is missing or malformed, derive severity from `queue_depth.current_depth` against `queue_depth.thresholds.warning` and `.critical`.
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

# Android Operator App (MVP) — Product Design Kickoff

## 1) Purpose

Build a native Android operator app for **DGN-DJ by DGNradio** focused on station control, alerts, and intervention workflows when away from the desktop launcher.

## 2) Assumptions

- Existing Windows desktop app remains the primary full-control surface in MVP.
- Android app is an operator tool, not a public listener app.
- Backend integration can be introduced incrementally via a lightweight local/remote API bridge.
- Target minimum supported version is Android 10 (API 29) for practical device coverage.

## 3) Product Outcomes

- Reduce mean time to acknowledge and resolve automation interruptions.
- Give operators mobile situational awareness (now playing, queue health, schedule conflicts, AI generation state).
- Support safe remote actions with strong guardrails and audit logging.

## 4) MVP Scope

### In scope

1. **Secure sign-in**
   - Email/password or token-based login.
   - Device binding + session expiration controls.

2. **Station status dashboard**
   - Current show, current/next track, automation mode, and clock drift indicator.
   - Health cards for content pipeline, TTS queue, and scheduler status.

3. **Alerts inbox**
   - Prioritized alert feed (critical/major/info).
   - Acknowledge, snooze, and open runbook actions.

4. **Manual interventions**
   - Skip/replay current item.
   - Trigger emergency fallback playlist.
   - Pause/resume automation with reason code.

5. **Audit trail**
   - Immutable activity feed for operator actions.

### Out of scope (MVP)

- Full schedule editing.
- Prompt engineering UI.
- Asset upload and media library management.
- Multi-station fleet management views.

## 5) UX Principles

- **Fast at-a-glance status**: one-screen health and now-playing visibility.
- **Low-risk controls**: all destructive actions require confirm + reason.
- **Offline-tolerant reads**: cached status with stale-data labeling.
- **Operator-first ergonomics**: large touch targets and clear severity color coding.

## 6) Technical Design (MVP)

### Client architecture

- **Kotlin + Jetpack Compose** UI.
- **MVVM + unidirectional data flow**.
- **Repository layer** with local cache (Room) + remote sync.
- **WorkManager** for resilient background sync and alert pull.

### Backend integration contract

- Introduce a minimal API facade to expose:
  - `/auth/*`
  - `/station/status`
  - `/alerts`
  - `/controls/actions`
  - `/audit/events`
- Use short-lived access tokens + refresh tokens.
- All control actions require idempotency keys and server-side authorization.

### Security controls

- Android Keystore-backed secret storage.
- TLS-only transport; certificate pinning in production build.
- Fine-grained RBAC for control actions.
- Full server-side audit event capture for every control mutation.

## 7) API/Event Model Draft

### Core entities

- `StationStatus`: mode, now_playing, next_item, scheduler_health, ai_pipeline_health, timestamp.
- `Alert`: id, severity, title, detail, created_at, acknowledged_by, state.
- `ControlAction`: id, type, reason_code, requested_by, requested_at, status.
- `AuditEvent`: actor, action, target, metadata, timestamp.

## 8) Delivery Plan

### Phase A — Product/UX Design (1–2 weeks)

- Confirm operator personas and top 5 on-call workflows.
- Produce wireframes for dashboard, alerts, and intervention flow.
- Freeze MVP acceptance criteria.

### Phase B — Platform Foundation (2–3 weeks)

- Implement auth + API facade + RBAC + audit schema.
- Stand up staging environment and test fixture data.

### Phase C — Android MVP Build (3–5 weeks)

- Build Compose screens + state management + API integration.
- Add offline cache, push/poll alert updates, and crash telemetry.

### Phase D — Pilot Rollout (1–2 weeks)

- Pilot with internal operators.
- Measure action latency, alert acknowledgement time, and failure recovery success.

## 9) Success Metrics

- p95 alert-to-acknowledge under 45 seconds.
- p95 emergency fallback trigger under 10 seconds.
- Crash-free sessions > 99.5% during pilot.
- At least 80% of pilot operators rate intervention UX as "clear" or better.

## 10) Risks and Mitigations

1. **No stable backend API today**
   - Mitigation: introduce narrow facade first; avoid exposing internal desktop internals directly.
2. **High-risk remote controls**
   - Mitigation: strict RBAC, explicit confirmations, reason codes, and immutable audit logs.
3. **Connectivity variance in mobile contexts**
   - Mitigation: cache-first rendering, retry policy, stale-state badges.

## 11) Immediate Next Steps

1. Approve MVP scope and non-goals.
2. Decide API facade hosting model (embedded local bridge vs standalone service).
3. Create architecture follow-up doc for backend/API deployment topology.
4. Start wireframes for the three MVP screens (Dashboard, Alerts, Intervention).

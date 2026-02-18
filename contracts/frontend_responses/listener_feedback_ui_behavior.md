# Listener Feedback UI Behavior

This document describes expected frontend behavior for `listener_feedback_ui_state_response`.

## Disabled feedback behavior

When `feedback_enabled` is `false`:

- Hide or disable interactive feedback controls so users cannot submit new reactions.
- Show a lightweight, non-technical message that feedback is unavailable.
- Use `disabled_reason_code` only for product messaging and analytics routing; do not expose backend/internal diagnostics.
- Continue rendering passive playback/persona UI context (for example, persona name) without prompting for feedback actions.

## Offline submission fallback

When connectivity is degraded or unavailable:

- If `offline_fallback.allow_queueing` is `true`, queue feedback submissions locally.
- Enforce `offline_fallback.max_queued_submissions` as a hard cap; discard oldest queued events first when at capacity.
- Expire queued feedback after `offline_fallback.queue_ttl_seconds`.
- Replay queued events when connection recovers while still honoring `submission_limits`.
- If queueing is not allowed, show a non-blocking failure state and do not retry indefinitely.

## Safety and data minimization

- Keep payloads frontend-safe: send only public context fields (`persona_id`, `persona_version_id`, optional `daypart` and `variant_id`).
- Do not include internal routing keys, scoring internals, or operator-only metadata in frontend contracts.

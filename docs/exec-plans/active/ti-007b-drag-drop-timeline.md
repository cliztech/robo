# Implementation Plan: Drag/Drop Weekly Timeline UI (v1.2)

## Scope
Execute the UI implementation of a weekly drag-and-drop timeline scheduler based on normalized schedule contracts. This fulfills the `P1 — v1.2 Scheduler UI Execution` requirement.

## Requirements
1. **Data Normalization:**
   - Render the timeline exclusively from the `timeline_blocks` normalized contract. No client-side translation or mapping of bespoke block shapes should occur.
   - The UI state perfectly mirrors the backend `GET /api/v1/scheduler-ui/state` structure.

2. **Interactivity (Drag & Drop):**
   - Implement vertical/horizontal drag-and-drop for `timeline_blocks`.
   - Implement block resizing to adjust duration.
   - **Snap behavior:** Blocks must snap to 15-minute grid intervals by default.
   - **Modifier key:** Holding a modifier key (e.g., `Shift` or `Alt`) reduces the snap resolution to 5-minute intervals for fine-grained control.

3. **Validation & Latency:**
   - On every drop or resize end event, the UI fires an asynchronous call to the backend `/validate` endpoint with the proposed normalized payload.
   - **SLA:** The UI interaction and immediate visual update must feel instantaneous. The `/validate` call round-trip latency must be `<= 200 ms` at the p95 percentile. If validation fails, the UI must gracefully revert the block to its previous state and display an inline conflict rendering (handled in TI-008).

## Component Architecture (React/Next.js)
- `WeeklyTimelineView`: The main grid container (days on X-axis, hours on Y-axis).
- `TimelineBlock`: The draggable/resizable item component.
- `useSchedulerState`: Custom hook managing the normalized contract, optimistic UI updates, and backend sync.
- `GridSnapManager`: Utility class for calculating 15-min / 5-min snap coordinates.

## Evidence and Verification
- [ ] Capture Chrome DevTools network trace showing `/validate` completing in `< 200ms` for 10 consecutive drag interactions.
- [ ] Verify the JSON payload sent to `/validate` matches the exact schema of `timeline_blocks` without missing fields.
- [ ] Verify visually that snap-to-grid behavior correctly respects the 15-minute default and 5-minute modifier.
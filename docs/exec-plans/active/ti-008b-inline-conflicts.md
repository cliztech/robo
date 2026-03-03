# Implementation Plan: v1.2 UI Inline Conflict Rendering

## Scope
Implement inline conflict rendering and resolution actions for the weekly timeline UI, fulfilling the v1.2 Scheduler UI Execution requirements.

## Requirements
1. **Visual State Mapping:**
   - The UI must parse the `/validate` normalized response which contains a `conflicts` array.
   - **Soft Conflicts:** (e.g., "Segment ends slightly past top of hour"). Rendered with a yellow/warning border and a caution tooltip.
   - **Hard Conflicts:** (e.g., "Two identical track categories scheduled at the exact same time"). Rendered with a red/error border, hatched background pattern, and a critical alert tooltip.
2. **Inline Resolution Actions:**
   - When a user clicks a conflicting block, a popover appears.
   - The backend `/validate` response should include `suggested_actions` for each conflict (e.g., "Truncate previous block", "Shift next block by 5m").
   - Clicking a suggested action fires a deterministic mutation to `/api/v1/scheduler-ui/state` to resolve the conflict.
   - **Goal:** The resolution flow must require `<= 3` clicks/keystrokes from identification to resolution.
3. **Publish Preflight Panel:**
   - A global "Publish" button triggers a preflight check.
   - If `hard_conflicts` exist, the publish action is blocked, and a summary list of unresolved hard conflicts is displayed with jump-to links.
   - If only `soft_conflicts` exist, a warning summary is shown, but the user can confirm to proceed.

## Component Architecture (React/Next.js)
- `ConflictOverlay`: A visual layer within `TimelineBlock` that renders the warning/error styling.
- `ResolutionPopover`: A context menu that lists the `suggested_actions` provided by the backend.
- `PublishPreflightModal`: The modal that intercepts the save action to summarize conflicts and enforce the hard-conflict block.

## Validation
- [ ] Create a hard conflict and verify the Publish button is blocked.
- [ ] Verify soft conflicts display yellow visual styling.
- [ ] Verify clicking a suggested inline action resolves the conflict in `<= 3` clicks.
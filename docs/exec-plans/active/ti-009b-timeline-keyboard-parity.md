# Implementation Plan: v1.2 UI Keyboard Parity

## Scope
Implement full keyboard accessibility for the v1.2 Weekly Timeline, matching the capabilities of pointer interactions (drag, drop, resize, conflict resolution).

## Requirements
1. **Focus Management:**
   - The timeline must implement a logical, deterministic focus order.
   - `Tab` navigates between timeline blocks.
   - Distinct, high-contrast visual focus indicators must be present on the active block.
2. **Block Operations (Move & Resize):**
   - With a block focused, pressing `Enter` enters "Edit Mode".
   - **Move:** `ArrowUp`/`ArrowDown` moves the block vertically across days/hours. `ArrowLeft`/`ArrowRight` shifts the block earlier/later. Default movement aligns to the 15-minute grid. Holding `Shift` uses the 5-minute modifier.
   - **Resize:** Holding `Alt` + `ArrowUp`/`ArrowDown` extends or reduces the duration of the block.
   - Pressing `Enter` commits the change, invoking the `/validate` endpoint exactly as a mouse drop would.
   - Pressing `Escape` cancels the edit, reverting the block to its original position.
3. **Conflict Resolution:**
   - If a block has a conflict, pressing `Space` or `ContextMenu` opens the `ResolutionPopover`.
   - Standard arrow keys navigate the popover list of `suggested_actions`. `Enter` confirms the action.
4. **Safety & Destructive Actions:**
   - Deleting a block (e.g., via `Delete` or `Backspace` keys) requires a subsequent confirmation (e.g., a secondary prompt or an "Undo" toast).
   - All keyboard mutations support standard `Ctrl+Z` / `Ctrl+Y` undo/redo stacks bounded to the active session.

## Acceptance Criteria
- [ ] QA verification: A user must be able to move a block from Monday 10:00 AM to Tuesday 2:00 PM using only the keyboard.
- [ ] QA verification: A user must be able to trigger a conflict and select an inline resolution action using only the keyboard.
- [ ] Focus indicators meet WCAG 2.1 AA contrast requirements.
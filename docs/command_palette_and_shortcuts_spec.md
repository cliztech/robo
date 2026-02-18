# Command Palette & Shortcut Architecture Spec

## 1. Purpose
Define a single, implementation-ready interaction model for:
- Global command palette behavior
- Shortcut architecture (global vs screen-specific)
- Contextual quick actions on dense screens
- First-run and contextual onboarding help

This spec applies to keyboard, mouse, and assistive-triggered command entry points.

---

## 2. Command Palette Scope

### 2.1 Invocation
- Primary shortcut: `Cmd/Ctrl + K`
- Secondary shortcut: `F1` (opens in "Help + Actions" mode)
- Topbar trigger: "Search actions…" input and icon button

### 2.2 Availability
The command palette must be available from every screen unless a blocking modal is active.

### 2.3 Core Interaction Model
- Type-ahead fuzzy search over command labels, aliases, and tags.
- Grouped result sections (in priority order):
  1. Screen context actions
  2. Scheduler actions
  3. Prompt/template actions
  4. Diagnostics navigation
  5. Recovery actions
  6. Global navigation/settings
- Arrow keys navigate results; `Enter` executes.
- `Cmd/Ctrl + Enter` opens a dry-run/preview when supported.
- `Esc` closes, restores focus to prior element.

### 2.4 Result Metadata
Each command entry should expose:
- `id`
- `title`
- `subtitle` (optional)
- `category`
- `scope` (`global`, `screen:<id>`, `selection:<type>`)
- `shortcut` (optional)
- `is_destructive`
- `requires_confirmation`
- `supports_preview`

---

## 3. Required Command Categories

### 3.1 Scheduler Actions
Minimum commands:
- Create schedule block
- Duplicate selected block
- Apply schedule preset to selection/daypart
- Mute/unmute automation for selection/time range
- Preview generated output for block/daypart
- Jump to Now
- Toggle timeline density (compact/comfortable)
- Recompute schedule conflicts

### 3.2 Prompt/Template Actions
Minimum commands:
- Open prompt/template library
- Create template from current selection
- Duplicate template
- Apply template to current segment/schedule block
- Validate template variables
- Preview rendered prompt with current variables
- Pin/unpin prompt for quick reuse

### 3.3 Diagnostics Navigation
Minimum commands:
- Open diagnostics home
- Jump to latest error
- Jump to scheduler warnings
- Open logs for current screen context
- Copy diagnostic bundle metadata
- Filter diagnostics by severity (`error`, `warn`, `info`)

### 3.4 Recovery Actions
Minimum commands:
- Restore last autosave
- Open backups for current config target
- Roll back latest schedule change
- Reset current screen filters/view state
- Retry failed automation task
- Open guided recovery checklist

---

## 4. Shortcut Architecture

### 4.1 Single Source of Truth
Maintain all shortcuts in a centralized registry with:
- default binding
- platform variants (Windows/macOS)
- scope (`global` or `screen-specific`)
- conflict class and precedence
- remappable flag

Example shape:
```json
{
  "id": "open_command_palette",
  "default": { "win": "Ctrl+K", "mac": "Cmd+K" },
  "scope": "global",
  "remappable": true,
  "precedence": 100
}
```

### 4.2 Global vs Screen-Specific
- **Global shortcuts**: always active unless a text input is focused and the command is not marked `allow_in_input`.
- **Screen-specific shortcuts**: only active when the screen route is focused and no higher-precedence handler intercepts.
- **Selection-specific shortcuts**: activate only when compatible selection state exists (e.g., schedule block selected).

### 4.3 Conflict Resolution Rules
Conflicts resolve by deterministic precedence:
1. System-reserved shortcuts (never override)
2. Active modal/dialog shortcuts
3. Global emergency/recovery shortcuts
4. Screen-specific shortcuts
5. Component-local shortcuts

If two bindings collide at same precedence:
- Prefer user-defined mapping over default.
- Otherwise prefer the mapping with stricter context (selection-specific > screen-specific > global).
- If still ambiguous, block assignment and show conflict prompt.

### 4.4 Remapping Support
Provide keyboard shortcut settings with:
- Search by command name or key chord
- Rebind flow with real-time conflict detection
- Reset single command or reset all defaults
- Import/export keymap JSON
- Read-only display for non-remappable/system-reserved bindings

---

## 5. Contextual Quick Actions (Dense Screens)

### 5.1 Schedule Block Context Menu
When a schedule block is selected or right-clicked, show quick actions:
- Duplicate
- Apply preset
- Mute automation
- Preview output

Add optional follow-up actions:
- Open related template
- Jump to diagnostics for this block
- Undo last block edit

### 5.2 Trigger Points
Quick actions should be accessible via:
- Right-click context menu
- Inline action kebab button
- Keyboard (`Shift + F10` / context-menu key)
- Command palette (same actions mirrored)

### 5.3 Behavior Requirements
- Actions must be idempotent where possible.
- Destructive/high-impact actions require confirm + undo affordance.
- Toast feedback should include a one-click undo when available.

---

## 6. Onboarding & Discoverability

### 6.1 First-Run Shortcut Coachmarks
On first app run (and after major updates), show coachmarks for:
- Open command palette (`Cmd/Ctrl + K`)
- Focus top search/location (`Cmd/Ctrl + L`)
- Open "What can I do here?" helper (`Shift + /`)

Coachmark rules:
- Dismissible, with "Don’t show again"
- Automatically hidden after first successful use of each shortcut
- Respect reduced-motion and accessibility preferences

### 6.2 “What can I do here?” Helper
Provide a searchable helper panel tied to the current screen context.

Requirements:
- Shortcut: `Shift + /`
- Shows screen-specific tasks, available quick actions, and relevant shortcuts
- Includes "Top actions" and "Recently used" sections
- Supports search and filter by task type (edit, diagnose, recover, navigate)
- Deep-links into command palette queries (e.g., prefilled search)

### 6.3 Context Binding
Each screen must publish a lightweight context descriptor:
- `screen_id`
- `available_actions[]`
- `selection_state`
- `diagnostic_state`

The helper and palette use this descriptor to prioritize relevant actions.

---

## 7. Accessibility & Reliability Requirements
- Full keyboard navigation and visible focus states.
- ARIA labels for command categories and action outcomes.
- Screen reader announcement for command execution success/failure.
- If command execution fails, provide inline retry and diagnostics link.
- Telemetry events for open/search/execute/fail with anonymized command IDs.

---

## 8. Acceptance Checklist
- [ ] Command palette is globally invokable and context-aware.
- [ ] Scheduler, prompt/template, diagnostics, and recovery command sets are implemented.
- [ ] Shortcut registry supports global vs screen-specific scopes.
- [ ] Conflict detection/resolution is deterministic and user-visible.
- [ ] Shortcut remapping (with reset + import/export) is available.
- [ ] Dense-screen contextual quick actions are accessible by pointer and keyboard.
- [ ] First-run coachmarks and contextual helper are implemented and searchable.

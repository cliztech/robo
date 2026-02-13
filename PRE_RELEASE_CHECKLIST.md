# Pre-release Checklist

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] If validation fails, confirm output starts with: `Configuration validation failed:` and lists actionable field-level errors.
- [ ] Archive config backups in `config/backups/` for any risky config changes.

## Startup Preflight Failure Runbook

When launching via `RoboDJ_Launcher.bat`, startup now runs config validation before opening the app.

1. If preflight fails, startup is blocked and the launcher prints:
   - `Configuration validation failed:`
   - One or more ` - [target] ...` error lines with JSON paths and expected values/types.
   - `Fix the fields above, then rerun: python config/validate_config.py`
   - `[RoboDJ] ERROR: Startup blocked because configuration validation failed.`
2. Fix only the reported config fields (`config/schedules.json`, `config/prompt_variables.json`).
3. Re-run `python config/validate_config.py` until the expected success string appears exactly:
   - `Configuration validation passed for schedules.json and prompt_variables.json.`
4. Relaunch using `RoboDJ_Launcher.bat`.
- [ ] Verify backup/restore operations align with `config/BACKUP_RESTORE_CONTRACT.md` (scope, retention, confirmations, rollback).

## Startup preflight behavior (operator runbook)

- `RoboDJ_Launcher.bat` now runs `config/validate_config.py` before launching the app.
- Startup continues only when validation prints:
  `Configuration validation passed for schedules.json and prompt_variables.json.`
- If validation fails, startup is blocked and the launcher keeps the actionable validator output visible.
- Operator actions on failure:
  1. Read each listed `[target]` error and fix the referenced field(s) in the matching config JSON.
  2. Re-run `python config/validate_config.py` until it prints the expected success string exactly.
  3. Re-launch `RoboDJ_Launcher.bat`.
- If startup is blocked because Python is missing, install Python 3 (or expose `py`/`python` on `PATH`) and rerun the launcher.
## Required Before Release Candidate

> Accountable signer for every gate item: **Release Manager**

- [ ] Config schema validation pass — Sign-off: Release Manager
- [ ] Backup/restore drill pass — Sign-off: Release Manager
- [ ] Crash recovery simulation pass — Sign-off: Release Manager
- [ ] Rollback path verified — Sign-off: Release Manager
- [ ] Execute the accessibility QA matrix in `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` for shell, overlays, and scheduler interactions.
- [ ] Verify keyboard-only flow for all release-critical user paths (no pointer required).
- [ ] Verify visible, logical focus order and focus restoration behavior for overlays/modals.
- [ ] Verify screen-reader naming/instructions for controls, dialogs, timeline events, and state changes.
- [ ] Verify WCAG AA color contrast in all supported themes and interactive states.
- [ ] Verify reduced-motion behavior for all key transitions and timeline interactions.
- [ ] Verify zoom/reflow behavior at 200%+ with no blocked or clipped critical actions.
- [ ] Enforce **No Ship** when custom interactive widgets (drag/drop, tab strip, timeline blocks) lack keyboard and ARIA equivalents.
- [ ] Block release on any P0 accessibility failure; track and resolve any P1 accessibility failures before final approval.

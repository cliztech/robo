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

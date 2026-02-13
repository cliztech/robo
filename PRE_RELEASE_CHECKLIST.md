# Pre-release Checklist

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive config backups in `config/backups/` for any risky config changes.

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

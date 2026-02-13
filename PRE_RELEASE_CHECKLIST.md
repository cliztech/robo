# Pre-release Checklist

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive config backups in `config/backups/` for any risky config changes.

## Required Before Release Candidate

> Accountable signer for every gate item: **Release Manager**

- [ ] Config schema validation pass — Sign-off: Release Manager
- [ ] Backup/restore drill pass — Sign-off: Release Manager
- [ ] Crash recovery simulation pass — Sign-off: Release Manager
- [ ] Rollback path verified — Sign-off: Release Manager

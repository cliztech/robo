# Pre-release Checklist

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive config backups in `config/backups/` for any risky config changes.
- [ ] Verify backup/restore operations align with `config/BACKUP_RESTORE_CONTRACT.md` (scope, retention, confirmations, rollback).

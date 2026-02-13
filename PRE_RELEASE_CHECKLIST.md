# Pre-release Checklist

> **Release gate:** Do **not** proceed with release until every item below is completed and signed off.

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm command output includes: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive backup snapshots in `config/backups/` for any risky configuration changes, and attach/archive those snapshots as release artifacts.

## Checklist Audit Sign-off

- **Checklist owner:** ____________________
- **Sign-off (name + date/time):** ____________________

# Pre-release Checklist

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Run runtime secret preflight: `python config/check_runtime_secrets.py --require-env-only`
- [ ] Confirm secret preflight output is: `Secret integrity check passed (key material redacted).`
- [ ] Archive config backups in `config/backups/` for any risky config changes.

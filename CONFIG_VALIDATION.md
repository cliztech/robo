# Configuration Validation

Use the validator before any deployment or handoff to catch malformed configuration changes early.

> **Hard gate:** Deployment/handoff must not proceed unless the validator command has been run and the required success line is present in output.

## What it validates

- `config/schedules.json` against `config/schemas/schedules.schema.json`
- `config/prompt_variables.json` against `config/schemas/prompt_variables.schema.json`

The validator reports actionable errors with JSON paths (for example `$.variable_settings.missing_variable_behavior`) and expected types/enums.

## Run locally

```bash
python config/validate_config.py
```

## Required success output

The run is only considered passing for release/deployment/handoff when output includes exactly:

```text
Configuration validation passed for schedules.json and prompt_variables.json.
```

## Example failure output

```text
Configuration validation failed:
 - [prompt_variables] $.variable_settings.missing_variable_behavior: value 'blank' is invalid, expected one of ['empty_string', 'leave_placeholder', 'error']
```

## Release gating

- **CI:** `.github/workflows/config-validation.yml` runs this check automatically on pull requests and pushes to `main`.
- **Manual pre-release / deployment / handoff:** do not proceed until `python config/validate_config.py` has been executed and output includes `Configuration validation passed for schedules.json and prompt_variables.json.`.
- **Risky config changes:** archive backup snapshots in `config/backups/` and include them as release/deployment artifacts for traceability and rollback readiness.

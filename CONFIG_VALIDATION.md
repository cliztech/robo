# Configuration Validation

Use the validator before any deployment or handoff to catch malformed configuration changes early.

## What it validates

- `config/schedules.json` against `config/schemas/schedules.schema.json`
- `config/prompt_variables.json` against `config/schemas/prompt_variables.schema.json`

The validator reports actionable errors with JSON paths (for example `$.variable_settings.missing_variable_behavior`) and expected types/enums.

## Run locally

```bash
python config/validate_config.py
```

## Example failure output

```text
Configuration validation failed:
 - [prompt_variables] $.variable_settings.missing_variable_behavior: value 'blank' is invalid, expected one of ['empty_string', 'leave_placeholder', 'error']
```

## Release gating

- **CI:** `.github/workflows/config-validation.yml` runs this check automatically on pull requests and pushes to `main`.
- **Manual pre-release:** include this command in your release checklist and require a passing run before shipping.

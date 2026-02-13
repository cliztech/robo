# Configuration Validation

Use the validator before any deployment or handoff to catch malformed configuration changes early.

## What it validates

- `config/schedules.json` against `config/schemas/schedules.schema.json`
- `config/prompt_variables.json` against `config/schemas/prompt_variables.schema.json`
- `config/autonomy_policy.json` against `config/schemas/autonomy_policy.schema.json`
- `config/autonomy_profiles.json` against `config/schemas/autonomy_profiles.schema.json`
- `config/persona_ops.json` against `config/schemas/persona_ops.schema.json`
- `config/interactivity_channels.json` against `config/schemas/interactivity_channels.schema.json`
- `config/editorial_pipeline_config.json` against `config/schemas/editorial_pipeline_config.schema.json`

The validator reports actionable errors with JSON paths in `[$.json.path]` style (for example `$.variable_settings.missing_variable_behavior`) and expected types/enums.

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

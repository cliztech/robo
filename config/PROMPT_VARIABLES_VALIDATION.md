# Prompt Variables Validation, Strict Mode, and Frontend States

This document defines the behavior represented by `config/prompt_variables.schema.json`.

## 1) `missing_variable_behavior` enum

`variable_settings.missing_variable_behavior` is constrained to:

- `empty_string`
  - Unresolved variable tokens are replaced with an empty string.
  - Frontend status SHOULD be `warning` when unresolved tokens are detected.
- `keep_token`
  - Unresolved variable tokens stay visible (e.g., `{weather}`).
  - Frontend status SHOULD be `warning` when unresolved tokens are detected.
- `warning`
  - Render proceeds, unresolved variables are reported in `validation_state`.
  - Frontend status SHOULD be `warning` if unresolved tokens exist.
- `strict_error`
  - **Strict mode**.
  - Any unresolved token MUST be surfaced as a validation error.
  - Frontend status MUST be `error` if unresolved tokens exist.

## 2) Frontend-facing warning/error payload

Use `validation_state` for dashboard rendering:

- `status`: `ok | warning | error`
- `warnings`: user-facing warning list
- `errors`: user-facing error list
- `unresolved_tokens`: unresolved placeholders in `{token}` format

### Status guidance

- `ok`
  - No unresolved tokens.
  - `warnings`, `errors`, and `unresolved_tokens` are empty.
- `warning`
  - Non-blocking issues exist (for example unresolved tokens in non-strict mode).
- `error`
  - Blocking issues exist (for example strict mode unresolved token failures).

## 3) Schema rules added for key sections

### `custom_variables`

- Must be an object.
- Keys must be lower_snake_case (`^[a-z][a-z0-9_]*$`).
- Values must be strings (max length 500).

### `time_variable_configs`

Each time variable config:

- Requires `source` and `format`.
- `source` enum: `now | show_start | show_end | custom_timestamp`.
- Optional: `timezone`, `locale`, `fallback_value`.
- If `source=custom_timestamp`, `custom_timestamp` (ISO date-time) is required.

### `variable_settings` override precedence

- New canonical field: `override_precedence`
  - `custom_over_builtin`
  - `builtin_over_custom`
- Legacy compatibility field remains: `custom_variables_override_builtin`.
- When legacy field is present, schema enforces consistency with `override_precedence`.

## 4) Dashboard preview examples

### A) Non-strict unresolved token (`warning`)

```json
{
  "preview_text": "Now playing: Neon Nights by {artist}",
  "validation_state": {
    "status": "warning",
    "warnings": [
      "1 unresolved variable found."
    ],
    "errors": [],
    "unresolved_tokens": [
      "{artist}"
    ]
  }
}
```

### B) Strict mode unresolved token (`error`)

```json
{
  "variable_settings": {
    "missing_variable_behavior": "strict_error"
  },
  "preview_text": "Tonight at {show_time}: {show_name}",
  "validation_state": {
    "status": "error",
    "warnings": [],
    "errors": [
      "Strict mode blocked rendering because unresolved variables were found."
    ],
    "unresolved_tokens": [
      "{show_time}",
      "{show_name}"
    ]
  }
}
```

### C) Fully resolved preview (`ok`)

```json
{
  "preview_text": "Tonight at 8:00 PM: Night Pulse",
  "validation_state": {
    "status": "ok",
    "warnings": [],
    "errors": [],
    "unresolved_tokens": []
  }
}
```

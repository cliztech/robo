# Runtime Bootstrap and Safe Config Tracking

This repository now tracks only **safe defaults/templates**. Machine-specific runtime state is kept outside versioned config files.

## What is versioned

- `config/templates/schedules.json`
- `config/templates/prompt_variables.json`
- `config/secret.key.example`
- `config/secret_v2.key.example`
- `scripts/bootstrap_runtime.py`

## What is not versioned

- `runtime/` (local runtime directory)
- `config/secret.key`
- `config/secret_v2.key`
- transient lock/signal/trial files in `config/`
- SQLite runtime databases

## Bootstrap local runtime files

From the repository root:

```bash
python scripts/bootstrap_runtime.py
```

Optional flags:

- `--runtime-dir <path>`: initialize to a custom runtime location.
- `--force`: overwrite existing runtime files.

The script initializes:

- `runtime/config/schedules.json`
- `runtime/config/prompt_variables.json`
- `runtime/config/secret.key`
- `runtime/config/secret_v2.key`
- `runtime/config/settings.db`
- `runtime/config/user_content.db`
- `runtime/config/prompts/`
- `runtime/config/scripts/`
- `runtime/config/music_beds/`
- `runtime/config/logs/`
- `runtime/config/cache/`
- `runtime/config/backups/`

> Note: If template DB files are not provided, empty SQLite DB files are created.

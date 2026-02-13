# Memory Service for Script Freshness

`memory_service.py` adds a SQLite-backed memory layer to support script generation freshness.

## Features

1. Stores recent on-air mentions (`song`, `topic`, `trivia`, `caller`, `promo`) with timestamps.
2. Produces recency penalties for prompt generation to reduce repeated phrasing.
3. Computes topic lifecycle state (`fresh`, `warming`, `saturated`, `cooldown`).
4. Persists per-persona lexical style memory (signature phrases and intensity bounds).
5. Detects duplicate scripts using string similarity and token-based semantic similarity.
6. Exposes reset controls for `show`, `day`, `week`, or `all` memory windows.

## Usage

```bash
python config/scripts/memory_service.py mention --kind topic --text "local food festival" --show-id morning_drive
python config/scripts/memory_service.py style-set --persona "DriveTime Host" --signature-phrase "You know the vibe" --intensity-min 0.35 --intensity-max 0.8
python config/scripts/memory_service.py prompt-context --show-id morning_drive --persona "DriveTime Host"
python config/scripts/memory_service.py script-check --show-id morning_drive --script "Good morning, here's what's happening around town..."
python config/scripts/memory_service.py reset --scope day --show-id morning_drive
```

## Database

Default database location:

- `config/memory_service.db`

Override with:

```bash
python config/scripts/memory_service.py --db /path/to/memory.db <command>
```

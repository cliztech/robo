# Editorial Event Pipeline

This script adds a lightweight external-event pipeline for RoboDJ runtime operations.

## Features
- Weather/news connectors with an optional trend source.
- Event normalization into this internal schema:
  - `headline`
  - `source`
  - `timestamp`
  - `confidence`
  - `locality`
- Editorial ranking using weighted relevance, freshness, and safety.
- Insertion rule selection:
  - `top_of_hour_bulletin`
  - `mid_break_mention`
  - `emergency_interrupt`
- Script line generation with source attribution and confidence disclaimers.
- Configurable `quiet_mode` for music-heavy formats.

## Usage
From the repository root:

```bash
python config/scripts/editorial_event_pipeline.py \
  --config config/editorial_pipeline_config.json \
  --sample-events config/scripts/sample_external_events.json
```

To use live APIs, set `sources.*.enabled=true` and provide `endpoint` values in
`config/editorial_pipeline_config.json`.

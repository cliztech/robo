# Scheduler Scripts

## `clockwheel_scheduler.py`
Implements a radio-style clockwheel scheduler with:
- `ClockTemplate` slot entities
- Rule constraints (artist/title separation, tempo curve, explicit windows, daypart persona)
- Fallback defaults when category inventory is empty
- Human-lock support for manual placement protection during replanning
- 24h simulation mode and HTTP endpoints
- Validation report before activation

### Usage
```bash
cd config/scripts
python clockwheel_scheduler.py --simulate
python clockwheel_scheduler.py --serve --port 8080
```

### HTTP Endpoints
- `GET /simulate` → returns a 24h predicted log (`audio_emitted: false`)
- `GET /validate` → returns schedule validation report

## `workflow_program_builder.py`
Generates a text milestone report from the machine-readable workflow program JSON.

### Usage
```bash
python config/scripts/workflow_program_builder.py
python config/scripts/workflow_program_builder.py --out config/custom_workflow_report.txt
```

## `validate_image_assets.py`
Validates top-level curated media files in `images/` against naming and dedupe policy.

### Usage
```bash
python config/scripts/validate_image_assets.py
python config/scripts/validate_image_assets.py --images-dir images
```

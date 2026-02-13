# dgn-robo-rippa

## Purpose
`dgn-robo-rippa` is the media-prep module responsible for ingesting source media and producing normalized clips/metadata ready for playout pipelines.

## Public Interfaces
- **Python package**: `dgn_robo_rippa`
- **Entry point**: `python -m dgn_robo_rippa.main`
- **Contract output**: emits `rippa.asset.normalized` events (see `docs/architecture/event-schema.json`).

## Build Targets
From the repository root:
- `make build-robo-rippa` — validate/compile the module source tree.
- `make run-robo-rippa` — run the module stub entrypoint.

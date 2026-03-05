# dgn-airwaves

## Purpose
`dgn-airwaves` is the audio-programming module responsible for generating and packaging on-air content units (segments, liners, and transitions) from upstream scheduling signals.

## Public Interfaces
- **Python package**: `dgn_airwaves`
- **Entry point**: `python -m dgn_airwaves.main`
- **Contract output**: emits `airwaves.segment.created` events (see `docs/architecture/event-schema.json`).

## Build Targets
From the repository root:
- `make build-airwaves` — build sdist/wheel into `dist/dgn-airwaves/` (no source-tree artifacts).
- `make run-airwaves` — run the module stub entrypoint.

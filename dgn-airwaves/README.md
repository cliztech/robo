# dgn-airwaves

## Purpose
`dgn-airwaves` is the audio-programming module responsible for generating and packaging on-air content units (segments, liners, and transitions) from upstream scheduling signals.

## Public Interfaces
- **Python package**: `dgn_airwaves`
- **Entry point**: `python -m dgn_airwaves.main`
- **Contract output**: emits `airwaves.segment.created` events (see `docs/architecture/event-schema.json`).

## Build Targets
From the repository root:
- `make build-airwaves` — validate/compile the module source tree.
- `make run-airwaves` — run the module stub entrypoint.

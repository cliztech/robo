# Module Architecture Contracts

This folder defines shared contracts for module-to-module integration across `dgn-airwaves` and `dgn-robo-rippa`.

## Artifacts
- `agentic_radio_runtime_model.md` — end-to-end MVP runtime flow, topics, state machines, and scaffold.
- `interface-contracts.md` — high-level API and dependency constraints.
- `event-schema.json` — JSON Schema for cross-module event payloads.

## Compatibility Rule
Any module change that alters emitted event fields or required dependency ranges must update these docs in the same change set.

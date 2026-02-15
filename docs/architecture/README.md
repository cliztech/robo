# Module Architecture Contracts

This folder defines shared contracts for module-to-module integration across `dgn-airwaves` and `dgn-robo-rippa`.

## Artifacts
- `agentic_radio_runtime_overview.md` — runtime flow, topics, state models, and MVP scaffolding.
- `interface-contracts.md` — high-level API and dependency constraints.
- `event-schema.json` — JSON Schema for cross-module event payloads.

## Compatibility Rule
Any module change that alters emitted event fields or required dependency ranges must update these docs in the same change set.

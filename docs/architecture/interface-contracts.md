# Inter-module Contracts

## 1. API Surface (Python)

### `dgn-airwaves`
- `dgn_airwaves.build_segment(segment_id: str) -> dict`
- Required output keys: `event_type`, `segment_id`, `module`
- `event_type` value: `airwaves.segment.created`

### `dgn-robo-rippa`
- `dgn_robo_rippa.normalize_asset(asset_id: str) -> dict`
- Required output keys: `event_type`, `asset_id`, `module`
- `event_type` value: `rippa.asset.normalized`

## 2. Event Format
All emitted events MUST satisfy `event-schema.json`.

## 3. Dependency Constraints
- Module packages must remain independently installable and buildable.
- No direct import from `dgn_airwaves` into `dgn_robo_rippa`, or vice versa.
- Shared types/contracts must live under `docs/architecture/` until a dedicated shared package is introduced.

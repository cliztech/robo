# Agentic Radio Runtime Overview (MVP)

This document captures a practical MVP architecture for an event-driven, multi-service radio runtime using NATS, Redis, Postgres, and Icecast-compatible streaming.

## Runtime model (happy path)

1. `library` ingests audio files (local folder or upload), stores metadata in Postgres, emits `track.added`.
2. `automation` maintains rotations/clocks and requests the next selection by emitting `playout.next_requested`.
3. `agent-dj` handles `playout.next_requested`, applies policy + memory + separation/request logic, then emits `playout.enqueue` (and optional `tts.enqueue` later).
4. `audio-engine` maintains deck and playout state, emits `now_playing`, and writes PCM output into an audio FIFO/pipe.
5. `streaming-gateway` reads the FIFO/pipe, transcodes via `ffmpeg`, streams to Icecast (or Shoutcast-compatible endpoints), and updates metadata hooks.
6. `requests` powers the "Ask the DJ" inbox (REST + WebSocket), emits `request.created`.
7. `console-web` and `remote-web` display runtime state (now playing, queue, requests, controls).

## Internal event bus

NATS topics for MVP:

- `track.added`
- `track.analyzed`
- `request.created`
- `playout.next_requested`
- `playout.enqueue`
- `tts.enqueue` (optional, later)
- `now_playing`
- `system.health`

## State machines

### DeckController (per deck A/B/C/D)

`IDLE -> LOADING -> READY -> PLAYING -> STOPPING -> IDLE` (with error transitions)

### Playout

`WAITING -> QUEUED -> PLAYING -> TRANSITIONING -> PLAYING -> ...`

### Automation clock

`TICK -> SELECT CATEGORY -> APPLY RULES -> EMIT NEXT_REQUESTED`

## Failure modes and recovery

- If `streaming-gateway` dies: core system can continue emitting `now_playing`; gateway reconnects to FIFO and resumes mount output.
- If `audio-engine` dies: gateway input drops; dead-air protection can loop a fallback file in gateway.
- If `agent-dj` dies: `automation` can switch to direct enqueue from rotations (fallback mode).
- If Postgres/Redis are unavailable: services degrade to in-memory operation for MVP and keep event loops alive.

## Monorepo scaffolding

```text
radio-agentic/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  docker-compose.yml
  .env.example

  shared/
    package.json
    src/
      events.ts
      nats.ts
      types.ts
      ws.ts

  services/
    library/
      package.json
      prisma/
        schema.prisma
      src/
        index.ts
        ingest.ts

    automation/
      package.json
      src/
        index.ts
        scheduler.ts
        rules.ts

    agent-dj/
      package.json
      src/
        index.ts
        policy.ts
        memory.ts

    requests/
      package.json
      prisma/
        schema.prisma
      src/
        index.ts
        ws.ts

    audio-engine/
      package.json
      src/
        index.ts
        deck.ts
        audioGraph.ts
        playout.ts

    streaming-gateway/
      package.json
      src/
        index.ts
        icecast.ts
        fallback.ts

  apps/
    console-web/
      package.json
      src/
        main.tsx
        App.tsx
        api.ts

    remote-web/
      package.json
      src/
        main.tsx
        App.tsx
        api.ts

  infra/
    icecast/
      icecast.xml
```

## Core shared primitives

### `shared/src/events.ts`

- Define `EventName` union for all bus topics.
- Define `EventEnvelope<T>`: `{ id, name, ts, source, data }`.
- Provide `mkEvent` helper to construct consistent envelopes.

### `shared/src/nats.ts`

- `createBus(url)` returns `{ publish, subscribe, close }`.
- `publish` writes JSON payloads keyed by event name.
- `subscribe` handles async iteration and typed event decoding.

### `shared/src/types.ts`

Include shared interfaces for:

- Domain types (`Track`, `RequestMsg`, `NowPlaying`)
- Audio abstractions (`AudioGraph`, `DeckController`, `TransitionPlanner`)
- Analysis/rendering (`TrackAnalyzer`, `StemRenderer`, `AdInserter`)
- Agent behavior (`AgentPolicy`, `MemoryStore`)

## Service responsibilities (critical files)

- **Library**: ingest folder/upload and emit `track.added`.
- **Requests**: `POST /requests`, WebSocket fanout, emit `request.created`.
- **Agent DJ**: maintain request/memory context and choose next track on `playout.next_requested`.
- **Automation**: scheduler loop to emit `playout.next_requested` at regular intervals.
- **Audio engine**: queue + deck handling, emit `now_playing`, write PCM to FIFO.
- **Streaming gateway**: consume FIFO PCM, transcode/stream to Icecast, metadata hooks.

## Docker and runtime notes

- Compose includes `nats`, `redis`, `icecast`, plus each service.
- Share `/tmp` volume between `audio-engine` and `streaming-gateway` for FIFO handoff.
- Mount `./music` into ingest/playout services.
- Ensure service images include `ffmpeg` and shell support for FIFO creation/processing.

## End-to-end runbook (MVP)

1. Put audio files in `./music/` (`.mp3`, `.wav`, `.m4a`, etc.).
2. Start stack: `docker compose up --build`
3. Ingest tracks: `curl -X POST http://localhost:4001/ingest`
4. Listen to stream: `http://localhost:8000/stream`
5. Create a request:
   - `curl -X POST http://localhost:4002/requests -H "content-type: application/json" -d '{"name":"May","message":"play rihanna"}'`

Expected flow:

`Library -> Automation -> Agent-DJ -> Audio Engine -> Streaming Gateway -> Icecast`

## Intentionally deferred (interfaces in place)

- Real beatmatching/harmonic transition planning
- Stem rendering + per-stem mixing runtime
- Icecast metadata mutation API integration
- Console waveform rendering and deck visuals
- Multi-bitrate output mounts

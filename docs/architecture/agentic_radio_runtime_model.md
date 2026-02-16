# Agentic Radio Runtime Model (MVP)

This document captures the proposed event-driven runtime for a modular radio automation stack using NATS, deck-oriented playout, and an Icecast-compatible streaming gateway.

## Happy-path runtime flow

1. **Library service** ingests local/uploaded audio, stores metadata in Postgres, and emits `track.added`.
2. **Automation service** maintains rotations/clocks and periodically emits `playout.next_requested`.
3. **Agent-DJ service** consumes requests + policy + memory and emits `playout.enqueue` (optionally `tts.enqueue`).
4. **Audio-engine service** manages deck state + queue and emits `now_playing` while writing PCM to FIFO/pipe.
5. **Streaming-gateway service** reads FIFO/pipe, encodes with `ffmpeg`, and pushes to Icecast/Shoutcast-compatible mount.
6. **Requests service** exposes Ask-the-DJ inbox over REST + WebSocket and emits `request.created`.
7. **Console/Remote web apps** render now playing, queue, decks placeholders, requests, and emergency controls.

## Internal event bus

Use **NATS** as a lightweight internal event bus.

### Topics

- `track.added`
- `track.analyzed`
- `request.created`
- `playout.next_requested`
- `playout.enqueue`
- `tts.enqueue` (optional)
- `now_playing`
- `system.health`

## State machines

### DeckController (per deck A/B/C/D)

`IDLE -> LOADING -> READY -> PLAYING -> STOPPING -> IDLE` (+ error transitions)

### Playout engine

`WAITING -> QUEUED -> PLAYING -> TRANSITIONING -> PLAYING -> ...`

### Automation clock

`TICK -> SELECT CATEGORY -> APPLY RULES -> EMIT NEXT_REQUESTED`

## Failure modes and recovery

- **streaming-gateway down**: system still emits `now_playing`; gateway reconnects to FIFO and resumes mount output.
- **audio-engine down**: gateway input drops; dead-air protection can loop fallback audio until FIFO resumes.
- **agent-dj down**: automation can use direct rotation fallback to publish `playout.enqueue`.
- **Postgres/Redis down**: degrade to in-memory mode for MVP while event loop remains available.

## Suggested monorepo scaffold

```text
radio-agentic/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  docker-compose.yml
  .env.example

  shared/
    src/{events.ts,nats.ts,types.ts,ws.ts}

  services/
    library/
    automation/
    agent-dj/
    requests/
    audio-engine/
    streaming-gateway/

  apps/
    console-web/
    remote-web/

  infra/
    icecast/icecast.xml
```

## Shared primitives and service contracts

The following TypeScript primitives should anchor MVP contracts:

- `EventName` + `EventEnvelope<T>` for consistent event payload framing.
- `createBus(url)` wrapper around NATS `publish`/`subscribe` with JSON payload encode/decode.
- Core types/interfaces:
  - `Track`, `RequestMsg`, `NowPlaying`
  - `AudioGraph`, `DeckController`, `TransitionPlanner`
  - `TrackAnalyzer`, `StemRenderer`, `AdInserter`
  - `AgentPolicy`, `MemoryStore`

## MVP runbook

1. Place test audio in `./music`.
2. Start stack: `docker compose up --build`.
3. Ingest tracks: `curl -X POST http://localhost:4001/ingest`.
4. Stream URL: `http://localhost:8000/stream`.
5. Create listener request:
   ```bash
   curl -X POST http://localhost:4002/requests \
     -H "content-type: application/json" \
     -d '{"name":"May","message":"play rihanna"}'
   ```

## Intentionally stubbed for later phases

- Beatmatching/harmonic transitions (`TransitionPlanner` hook only).
- Stems rendering pipeline (`StemRenderer` interface only).
- Icecast metadata admin API wiring (currently log-level behavior).
- Rich waveform rendering in console/remote UIs.
- Multi-bitrate/multi-mount streaming outputs.

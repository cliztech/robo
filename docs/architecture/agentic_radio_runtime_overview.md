# Agentic Radio Runtime Overview (MVP)

This document captures the proposed happy-path runtime model, event bus contracts, state machines, and MVP scaffolding for a modular AI radio stack.

## 1) Runtime model (happy path)

1. **library** ingests local/uploaded audio, stores track metadata, emits `track.added`.
2. **automation** maintains rotations/clocks and requests the next playout candidate via `playout.next_requested`.
3. **agent-dj** listens for `playout.next_requested`, applies policy + memory + separation/request matching, emits `playout.enqueue` (and optional `tts.enqueue` later).
4. **audio-engine** runs deck/queue logic, emits `now_playing`, and writes PCM into a FIFO/pipe.
5. **streaming-gateway** reads FIFO PCM, encodes/pushes to Icecast/Shoutcast-compatible mount, and updates metadata.
6. **requests** exposes Ask-the-DJ inbox (REST + WebSocket) and emits `request.created`.
7. **console-web / remote-web** render operator/mobile views (now playing, queue, requests, emergency controls).

## 2) Internal event bus

- **Bus:** NATS
- **Core topics:**
  - `track.added`
  - `track.analyzed`
  - `request.created`
  - `playout.next_requested`
  - `playout.enqueue`
  - `tts.enqueue` (optional)
  - `now_playing`
  - `system.health`

A typed event envelope should be used for every publish/subscribe path:

```ts
export type EventEnvelope<T> = {
  id: string;
  event_type: EventName;
  ts: string;
  module: string;
  data: T;
};
```

## 3) State machines

### DeckController (per deck A/B/C/D)

`IDLE -> LOADING -> READY -> PLAYING -> STOPPING -> IDLE` (+ error transitions)

### Playout engine

`WAITING -> QUEUED -> PLAYING -> TRANSITIONING -> PLAYING -> ...`

### Automation clock

`TICK -> SELECT CATEGORY -> APPLY RULES -> EMIT NEXT_REQUESTED`

## 4) Failure modes and recovery behavior

- **streaming-gateway fails:** other services continue; gateway restarts and reconnects to FIFO.
- **audio-engine fails:** gateway can switch to dead-air fallback loop when FIFO ends.
- **agent-dj fails:** automation can enqueue directly from rotation fallback.
- **Postgres/Redis unavailable:** degrade to in-memory mode while event loop stays alive.

## 5) Monorepo scaffolding (proposed)

```text
radio-agentic/
  shared/
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
    icecast/
```

## 6) Shared primitives to keep stable

- Typed event names and envelope helpers (`events.ts`)
- NATS wrapper (`nats.ts`) with typed publish/subscribe helpers
- Shared domain types (`types.ts`) for `Track`, `RequestMsg`, `NowPlaying`
- Interface contracts for:
  - audio graph/deck control
  - transition planning and analysis
  - stems/ad insertion
  - agent policy + memory store

## 7) MVP execution notes

- Start with sequential playout and crossfade hooks before full beatmatching.
- Keep Icecast metadata updates optional in MVP (log first, then admin endpoint/libshout).
- Use a simple NATS-to-WS bridge to expose `now_playing` to web apps.
- Keep service containers minimal (`node:20-alpine`, `ffmpeg`, `bash`) and iterate to full TS builds later.

## 8) End-to-end smoke path

1. Add sample audio files to `./music`.
2. Run `docker compose up --build`.
3. Trigger ingest (`POST /ingest`).
4. Submit an Ask-the-DJ request (`POST /requests`).
5. Verify `now_playing` emissions and Icecast mount playback.

## 9) Intentional MVP stubs

- Beatmatching/harmonic transition logic
- Stem rendering pipeline
- Icecast metadata update integration
- Waveform rendering in console UI
- Multi-bitrate encoder outputs


# radio-agentic (MVP scaffold)

Event-driven AI radio automation scaffold using NATS, Redis, and Icecast.

## Local dev credentials

Icecast credential defaults are intentionally invalid placeholders (`__SET_IN_ENV__`) so you do not accidentally run with known default passwords.

1. Copy `radio-agentic/.env.example` to `.env` in `radio-agentic/`.
2. Set real values for:
   - `ICECAST_PASS`
   - `ICECAST_SOURCE_PASSWORD`
   - `ICECAST_ADMIN_PASSWORD`
   - `ICECAST_PASSWORD`
   - `ICECAST_RELAY_PASSWORD`
3. Start with `docker compose up --build`. The streaming gateway now fails fast if placeholder values are detected.

## Run

1. Add audio files to `./music`.
2. Start stack:

```bash
docker compose up --build
```

3. Ingest tracks:

```bash
curl -X POST http://localhost:4001/ingest
```

4. Send request:

```bash
curl -X POST http://localhost:4002/requests \
  -H "content-type: application/json" \
  -d '{"name":"May","message":"play rihanna"}'
```

5. Listen at `http://localhost:8000/stream`.


## Stream listener telemetry events

The `streaming-gateway` service polls Icecast stats (`/status-json.xsl`) and publishes listener metrics to NATS: `stream.listeners`.

Configuration:
- `ICECAST_STATS_POLL_INTERVAL_MS` (default `10000`)
- `ICECAST_STATS_FAILURE_THRESHOLD` (default `3`)
- `ICECAST_STATS_PATH` (default `/status-json.xsl`; accepts full URL)

Event payload (`stream.listeners`):
- `totalListeners: number`
- `streamCount: number`
- `streams: Array<{ mount, listeners, listenerPeak, listenUrl, streamName, description, startedAt? }>`
- `polledAt: string` (ISO-8601)

After `ICECAST_STATS_FAILURE_THRESHOLD` consecutive poll failures, `streaming-gateway` logs the failure and emits `system.health` with a degraded alert payload (`StreamPollingAlertEvent`).

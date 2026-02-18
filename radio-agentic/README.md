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

# radio-agentic (MVP scaffold)

Event-driven AI radio automation scaffold using NATS, Redis, and Icecast.

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

# AetherRadio — API Routes Reference

## Auth

- `GET /api/auth/callback` — OAuth callback/session finalization

## Tracks

- `POST /api/tracks/upload` — create upload intent and metadata shell
- `POST /api/tracks/analyze` — run FFprobe/OpenAI analysis
- `GET /api/tracks/:id` — track details
- `PATCH /api/tracks/:id` — update editable track metadata
- `DELETE /api/tracks/:id` — soft delete
- `GET /api/tracks/:id/waveform` — waveform data

## AI

- `POST /api/ai/analyze-track` — classify mood/genre/energy
- `POST /api/ai/generate-playlist` — produce queue recommendation

## Streaming

- `GET /api/stream/:slug` — station stream metadata/handshake proxy

## Billing

- `POST /api/webhooks/stripe` — subscription + payment events

## Standard Response Envelope

```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "uuid"
}
```

## Error Codes

- `400` invalid request payload
- `401` unauthenticated
- `403` unauthorized for station resource
- `404` resource not found
- `409` conflict (e.g., duplicate slug)
- `429` rate limited
- `500` internal failure

_Last updated: 2026-02-14_

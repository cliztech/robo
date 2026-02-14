# AetherRadio - API Routes Reference

## Conventions

- Base path: `/api`
- JSON request/response
- Auth required unless explicitly public
- Standard error shape: `{ error: string, code?: string }`

## Auth

### `GET /api/auth/callback`

Handles OAuth/email-link callback and session bootstrap.

## Tracks

### `POST /api/tracks/upload`

Create upload URL or direct upload transaction.

**Body**

```json
{
  "stationId": "uuid",
  "filename": "song.mp3",
  "contentType": "audio/mpeg",
  "sizeBytes": 10485760
}
```

### `POST /api/tracks/analyze`

Runs FFprobe + AI enrichment.

### `GET /api/tracks/:id`

Fetch track metadata.

### `PATCH /api/tracks/:id`

Update editable metadata fields.

### `DELETE /api/tracks/:id`

Soft-delete or archive a track.

## AI

### `POST /api/ai/analyze-track`

Returns genre/mood/energy/tag predictions.

### `POST /api/ai/generate-playlist`

Builds an ordered playlist using station constraints.

## Streaming

### `GET /api/stream/:slug`

Returns stream endpoint metadata or signed stream URL.

## Webhooks

### `POST /api/webhooks/stripe`

Processes billing events and updates entitlements.

## Health and Ops (Recommended)

- `GET /api/health`
- `GET /api/version`

## Validation Expectations

- Zod schema validation on all mutable endpoints.
- Role checks for station ownership.
- Request logging with correlation IDs.

Last Updated: February 14, 2026

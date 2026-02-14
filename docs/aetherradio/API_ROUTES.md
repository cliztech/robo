# AetherRadio — API Routes Reference

## Auth

### `GET /api/auth/callback`

Handles auth provider callback and session finalization.

## Tracks

### `POST /api/tracks/upload`

Upload one or more audio files and enqueue processing.

**Request**: `multipart/form-data`  
**Response**: upload ids + initial statuses

### `POST /api/tracks/analyze`

Run metadata + AI analysis for a track.

### `GET /api/tracks/[id]`

Fetch track details.

### `PATCH /api/tracks/[id]`

Update editable metadata (title, artist, tags).

### `DELETE /api/tracks/[id]`

Soft-delete track and revoke stream references.

### `GET /api/tracks/[id]/waveform`

Return waveform data points or waveform asset URL.

## AI

### `POST /api/ai/analyze-track`

Returns AI classification fields (genre, mood, energy, confidence).

### `POST /api/ai/generate-playlist`

Generate a playlist candidate for a station and constraints.

## Streaming

### `GET /api/stream/[slug]`

Station stream endpoint/proxy metadata response.

## Webhooks

### `POST /api/webhooks/stripe`

Processes Stripe billing events.

## Response Contract Guidelines

- Use typed response envelope: `{ success, data, error }`
- Return stable error codes and machine-readable messages
- Include request correlation id in logs

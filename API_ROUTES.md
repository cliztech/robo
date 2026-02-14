# API Routes Reference

**Version:** v1  
**Updated:** February 14, 2026

## Base Principles

- All protected endpoints require authentication.
- Use consistent JSON envelopes for success and error responses.
- Use HTTP status codes semantically (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`).
- Include request IDs in logs and error payloads for debugging.

## Response Shapes

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-02-14T12:00:00.000Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload",
    "details": {}
  },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-02-14T12:00:00.000Z"
  }
}
```

## Health & Diagnostics

### `GET /api/health`

Returns service health summary.

### `GET /api/test-db`

Runs lightweight database connectivity check.

## Auth Routes

### `POST /api/auth/sign-in`

Signs in user using email/password.

### `POST /api/auth/sign-up`

Creates account and triggers verification flow.

### `POST /api/auth/sign-out`

Revokes current session.

### `POST /api/auth/forgot-password`

Sends password reset email.

### `POST /api/auth/reset-password`

Finalizes password reset with token.

## Station Routes

### `GET /api/stations`

Returns stations for current user.

### `POST /api/stations`

Creates a new station.

### `GET /api/stations/:stationId`

Fetches one station by ID.

### `PATCH /api/stations/:stationId`

Updates station properties.

### `DELETE /api/stations/:stationId`

Deletes station (or soft-delete).

## Track Routes

### `GET /api/tracks?station_id=:stationId`

Lists tracks for a station.

### `POST /api/tracks`

Creates initial track record before upload.

### `GET /api/tracks/:trackId`

Fetches track details + processing state.

### `PATCH /api/tracks/:trackId`

Updates editable metadata.

### `DELETE /api/tracks/:trackId`

Deletes track + related storage objects.

## Upload Routes

### `POST /api/upload/sign`

Generates signed upload URL after ownership checks.

**Input**:

```json
{
  "station_id": "uuid",
  "filename": "intro-track.wav",
  "mime_type": "audio/wav",
  "size": 12345678
}
```

### `POST /api/upload/confirm`

Confirms object upload and transitions record status.

### `POST /api/upload/cancel`

Cancels pending upload and cleans temporary references.

## Audio Processing Routes

### `POST /api/audio/process`

Starts audio processing for a track.

### `GET /api/audio/process/:jobId`

Gets processing job status.

## Playlist Routes

### `GET /api/playlists?station_id=:stationId`

Lists playlists.

### `POST /api/playlists`

Creates playlist.

### `PATCH /api/playlists/:playlistId`

Updates playlist metadata.

### `DELETE /api/playlists/:playlistId`

Deletes playlist.

### `POST /api/playlists/:playlistId/tracks`

Adds track(s) to playlist.

### `DELETE /api/playlists/:playlistId/tracks/:trackId`

Removes track from playlist.

## Broadcast & Queue Routes

### `GET /api/queue/current?station_id=:stationId`

Returns current playout queue.

### `POST /api/queue/rebuild`

Rebuilds queue from scheduling + fallback rules.

### `GET /api/broadcast/history?station_id=:stationId`

Returns play history with pagination.

## Analytics Routes

### `POST /api/analytics/events`

Ingests client analytics events.

### `GET /api/analytics/summary?station_id=:stationId`

Returns aggregated dashboard metrics.

## Notifications Routes

### `GET /api/notifications`

Lists user notifications.

### `PATCH /api/notifications/:notificationId/read`

Marks notification as read.

## Error Codes (Suggested)

- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `UPLOAD_FAILED`
- `PROCESSING_FAILED`
- `INTERNAL_ERROR`

## Validation Recommendations

- Use `zod` schemas for every request payload.
- Return field-level validation issues in `error.details`.
- Reject unknown keys to avoid silent misuse.

## Security Recommendations

- Enforce ownership checks in every station-scoped endpoint.
- Do not trust client-supplied user IDs.
- Apply rate limiting on auth and upload routes.
- Redact sensitive tokens/secrets in logs.

## Implementation Notes

- Keep endpoint handlers small and delegate logic to `src/lib/*` services.
- Prefer server-side Supabase clients for trusted operations.
- Use idempotency keys for retry-prone write endpoints.

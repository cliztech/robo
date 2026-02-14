# AetherRadio - API Routes Reference

## Overview

All routes are implemented as Next.js App Router handlers (`src/app/api/**/route.ts`).

Response format convention:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

## Authentication

## `GET /api/auth/callback`

Exchanges OAuth code for session and redirects user.

Query params:
- `code` (required)
- `next` (optional, validated redirect)

Errors:
- `400` invalid/missing code
- `401` session exchange failed

## Tracks

## `POST /api/tracks/upload`

Creates upload session or returns signed upload URL.

Request body:

```json
{
  "stationId": "uuid",
  "fileName": "track.mp3",
  "mimeType": "audio/mpeg",
  "size": 12345678
}
```

Response:

```json
{
  "success": true,
  "data": {
    "trackId": "uuid",
    "uploadUrl": "https://...",
    "storagePath": "stations/<id>/tracks/<uuid>.mp3",
    "expiresIn": 600
  }
}
```

## `POST /api/tracks/analyze`

Triggers metadata extraction and AI analysis.

Request body:

```json
{
  "trackId": "uuid",
  "stationId": "uuid"
}
```

Response fields:
- duration
- bpm
- energyLevel
- mood
- loudnessLufs
- waveformPath

## `GET /api/tracks/[id]`
Returns track metadata.

## `PATCH /api/tracks/[id]`
Updates editable track fields (title, artist, tags, etc.).

## `DELETE /api/tracks/[id]`
Soft-deletes or archives track depending on policy.

## `GET /api/tracks/[id]/waveform`
Returns waveform JSON data or signed URL.

## AI

## `POST /api/ai/analyze-track`

Runs LLM-assisted categorization and quality scoring.

Request body:

```json
{
  "trackId": "uuid",
  "promptProfile": "default"
}
```

## `POST /api/ai/generate-playlist`

Generates ordered track list based on constraints.

Request body:

```json
{
  "stationId": "uuid",
  "seed": {
    "mood": "uplifting",
    "energyCurve": "ramp-up",
    "durationMinutes": 120,
    "avoidRecentHours": 6
  }
}
```

## Stream

## `GET /api/stream/[slug]`

Public or tokenized stream proxy endpoint.

Possible behavior:
- Redirect to Icecast mount
- Stream passthrough with metadata headers

## Webhooks

## `POST /api/webhooks/stripe`

Handles subscription and billing lifecycle events.

Supported events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Common Status Codes

- `200` Success
- `201` Resource created
- `400` Validation error
- `401` Unauthenticated
- `403` Unauthorized for resource
- `404` Resource not found
- `409` Conflict (duplicate/invalid state)
- `422` Unprocessable payload
- `429` Rate limited
- `500` Internal server error

## Security & Validation Rules

- Zod validation on all request bodies.
- Role-based checks on all station-scoped routes.
- Structured error responses; never leak internal stack traces.
- Rate limiting for auth, uploads, and AI endpoints.
- Request IDs in logs for traceability.

## Example Error Payload

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "stationId is required",
    "details": {
      "field": "stationId"
    }
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Last Updated: February 14, 2026

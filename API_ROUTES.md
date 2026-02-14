# API Routes: Contract and Implementation Checklist

**Goal**: Define route groups, request/response contracts, auth expectations, and validation rules for initial platform development.

## API Conventions

- Base path: `/api`
- Content type: `application/json`
- Authenticated routes require active session
- Mutating routes (`POST`, `PATCH`, `DELETE`) require ownership checks

### Success Response Shape

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Error Response Shape

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input is invalid",
    "details": {}
  }
}
```

## Auth Routes

### `GET /api/auth/session`

Returns current authenticated user + session metadata.

### `POST /api/auth/logout`

Invalidates active session and clears cookies.

## Station Routes

### `GET /api/stations`

List stations owned by authenticated user.

### `POST /api/stations`

Create station.

Validation highlights:

- Required: `name`, `slug`
- Slug unique per platform

### `GET /api/stations/:id`

Get station details + current runtime status.

### `PATCH /api/stations/:id`

Update editable station fields.

### `DELETE /api/stations/:id`

Soft-delete or archive station (recommended over hard delete in production).

## Track Routes

### `GET /api/tracks?stationId=...`

List tracks by station with pagination and filters.

### `GET /api/tracks/:id`

Get single track details + processing state.

### `PATCH /api/tracks/:id`

Update track metadata (title, tags, publish state).

### `DELETE /api/tracks/:id`

Delete track record and related storage object(s).

## Upload Routes

### `POST /api/upload/signed-url`

Generate one-time signed upload URL.

Expected request fields:

- `stationId`
- `filename`
- `contentType`
- `sizeBytes`

### `POST /api/upload/finalize`

Confirm upload object and create `tracks` row.

Expected request fields:

- `stationId`
- `objectPath`
- `originalFilename`
- `idempotencyKey`

### `POST /api/upload/artwork`

Upload station/track artwork image and return public URL.

## Playlist Routes

### `GET /api/playlists?stationId=...`

List playlists for a station.

### `POST /api/playlists`

Create playlist.

### `PATCH /api/playlists/:id`

Update playlist metadata/order settings.

### `DELETE /api/playlists/:id`

Delete playlist.

## Broadcast Routes

### `POST /api/broadcast/start`

Start stream session for station.

### `POST /api/broadcast/stop`

Stop active stream session.

### `GET /api/broadcast/status?stationId=...`

Return live status (online/offline/current track/listeners).

## AI Routes

### `POST /api/ai/generate-segment`

Generate DJ/script segment from prompt + station context.

### `POST /api/ai/schedule-suggestion`

Generate playlist/scheduling recommendations.

## Billing Routes

### `POST /api/billing/create-checkout-session`

Create Stripe Checkout session.

### `POST /api/billing/webhook`

Receive Stripe webhook events (signature verification required).

### `GET /api/billing/subscription`

Return current plan/subscription status.

## Health & Diagnostics Routes

### `GET /api/health`

Basic liveness/readiness response.

### `GET /api/test-db`

Database connectivity smoke test endpoint.

## Validation & Security Requirements

Apply to all implemented routes:

- Zod schema validation for body/query/params
- Ownership checks (station/track/playlists)
- Rate limiting for auth, upload, and AI endpoints
- Structured logs with request ID, actor ID, route, latency
- Safe error handling (no secrets in responses)

## Recommended HTTP Status Codes

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Unprocessable Entity
- `429` Too Many Requests
- `500` Internal Server Error

## Suggested Implementation Order

1. Auth/session routes
2. Station CRUD routes
3. Signed upload + finalize routes
4. Track CRUD + processing routes
5. Broadcast status/control routes
6. Billing routes
7. AI routes

## Verification Checklist

Before moving to frontend integration:

- [ ] Route stubs exist for each group
- [ ] Validation schemas added per route
- [ ] Ownership checks implemented for mutating endpoints
- [ ] Error shape standardized across all routes
- [ ] Integration tests added for happy/error paths

## Next Step

After route stubs are implemented, proceed with integration tests and frontend API client wiring.

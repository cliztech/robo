# Phase 4: File Upload, Storage, and Finalization

**Timeline**: Day 9-10  
**Goal**: Implement secure and observable media upload workflows with Supabase Storage

## Prerequisites

- [ ] Phases 0-3 completed
- [ ] Storage buckets exist: `tracks`, `artwork`, `avatars`
- [ ] Storage policies and RLS verified
- [ ] Auth/session flow operational

## Step 1: Build Track Upload UI

Create `src/components/upload/track-uploader.tsx` with:

- Drag-and-drop zone (`react-dropzone`)
- File validation feedback
- Per-file progress bars
- Retry/cancel controls
- Final status (`queued`, `processing`, `ready`, `failed`)

## Step 2: Request Signed Upload URL

Create `src/app/api/upload/signed-url/route.ts`:

Input:

- `stationId`
- `filename`
- `contentType`
- `sizeBytes`

Server behavior:

1. Authenticate requester
2. Verify station ownership
3. Validate MIME type and file size
4. Generate a new, unique storage key (e.g., using a UUID) to prevent path traversal issues.
5. Return signed upload URL + object path

## Step 3: Upload from Client with Progress

Create `src/lib/upload/client.ts`:

- `requestSignedUploadUrl(payload)`
- `uploadFileWithProgress(url, file, onProgress)`
- `finalizeUpload(payload)`

Implementation notes:

- Use `XMLHttpRequest` or fetch-stream strategy for progress events
- Retry transient failures with capped backoff
- Preserve idempotency token for finalize step

## Step 4: Finalize Upload and Create Track

Create `src/app/api/upload/finalize/route.ts`:

Server behavior:

1. Validate upload object exists in storage
2. Verify requester owns station
3. Insert track row with `processing_status = 'pending'`
4. Enqueue audio processing
5. Return created track ID + initial status

## Step 5: Add Artwork Upload Flow

Add endpoint: `src/app/api/upload/artwork/route.ts`

Rules:

- Max size: `10MB`
- MIME: `image/jpeg`, `image/png`, `image/webp`
- Upload to `artwork` bucket
- Save public URL in station/track metadata

## Step 6: Enforce Upload Security Controls

Required controls:

- Ownership checks for all write operations
- Server-side MIME + extension validation
- Filename sanitization (strip unsafe chars)
- Rate limiting on signed URL and finalize endpoints
- Reject suspicious path traversal patterns

## Step 7: Add Upload Observability

Emit structured events:

- `upload_started`
- `upload_progress`
- `upload_failed`
- `upload_completed`
- `upload_finalized`

Persist key events in `analytics_events` with:

- `user_id`
- `station_id`
- `track_id` (if available)
- payload metadata (size, type, duration, latency)

## Step 8: Handle Failure and Recovery

Implement recovery paths:

- Orphan object cleanup job for un-finalized uploads
- Idempotent finalize endpoint to avoid duplicate rows
- Expired signed URL refresh flow
- Explicit user-facing retry states

## Step 9: Verify Upload End-to-End

Run:

```bash
pnpm dev
pnpm type-check
pnpm lint
```

Manual checks:

- [ ] Valid audio upload succeeds
- [ ] Oversized upload is rejected
- [ ] Unsupported MIME type is rejected
- [ ] Cross-station unauthorized upload is blocked
- [ ] Finalize creates exactly one track row
- [ ] Processing starts automatically after finalize

## Troubleshooting

### Issue: Upload returns 403

**Fix:** Verify storage policy conditions, JWT/session validity, and bucket name/path.

### Issue: Finalize creates duplicate tracks

**Fix:** Add idempotency key + unique finalize constraint at API/DB layers.

### Issue: Progress stalls near completion

**Fix:** Ensure client completes upload request before finalize call and handles network retries.

## Exit Criteria

Before implementing broader API contracts:

- [ ] Upload + finalize path is stable
- [ ] DB and storage consistency checks pass
- [ ] Access controls block unauthorized writes
- [ ] Observability events are emitted

## Next Step

Proceed to **API_ROUTES.md**.
# Phase 4 - File Upload System (Day 8-10)

## Goal

Provide reliable batch upload, metadata extraction, and storage indexing for track assets.

## Scope

- Drag-and-drop multi-file uploader
- File type/size validation
- Resumable uploads to Supabase Storage
- FFprobe metadata extraction
- Track record creation and dedup checks

## Accepted Formats

- MP3
- WAV
- FLAC
- AAC/M4A
- OGG

## Upload Flow

1. User selects files.
2. Client validates extension and size.
3. Files upload to storage bucket.
4. API triggers metadata analysis.
5. Track records are saved to DB.
6. UI reflects success/failure per file.

## Error Handling

- Retry with exponential backoff for transient failures.
- Preserve partial successes.
- Show actionable per-file error messages.

## Validation

- Upload 1, 10, and 100-file batches.
- Verify progress bars and completion statuses.
- Confirm metadata persistence in DB.

Last Updated: February 14, 2026

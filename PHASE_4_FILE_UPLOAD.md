# Phase 4: File Upload Workflow & Storage Lifecycle

**Timeline**: Day 9-10  
**Goal**: Build secure, resilient upload flows for audio assets and associated metadata

## Prerequisites

- [ ] Phases 0-3 completed
- [ ] Supabase storage buckets configured (`tracks`, `artwork`, `avatars`)
- [ ] Authentication + ownership checks working
- [ ] Audio processor ready for post-upload jobs

## Step 1: Create Upload UI Components

Create components:

- `src/components/upload/dropzone.tsx`
- `src/components/upload/upload-progress.tsx`
- `src/components/upload/upload-errors.tsx`
- `src/components/upload/track-metadata-form.tsx`

Use `react-dropzone` for drag-and-drop.

## Step 2: Define Upload Constraints

Enforce on both client and server:

- Max size: 500MB audio, 10MB artwork
- Allowed MIME types for each bucket
- Max filename length and sanitization
- User ownership constraints by station

## Step 3: Generate Signed Upload URLs

Create API route `src/app/api/upload/sign/route.ts`:

- Validate authenticated user
- Validate station ownership
- Generate path format: `tracks/<station_id>/<track_id>/<filename>`
- Return signed URL + expiry

## Step 4: Perform Direct Uploads to Storage

Client flow:

1. Request signed URL
2. Upload file directly to storage
3. Confirm upload completion via API
4. Trigger background audio processing

## Step 5: Persist Upload Records

Create `tracks` row with lifecycle fields:

- `upload_status`: `pending | uploaded | failed`
- `processing_status`: `queued | processing | completed | failed`
- `storage_path`
- `original_filename`
- `mime_type`
- `file_size`

## Step 6: Add Artwork Upload Support

For station/track artwork:

- Resize/compress image client-side (optional)
- Upload to `artwork` bucket
- Save public URL in database
- Validate MIME and dimensions

## Step 7: Implement Retry + Resume UX

Add user-friendly recovery features:

- Retry failed upload
- Clear failed state
- Preserve metadata form values on failure
- Optional chunked uploads for large files

## Step 8: Add Deletion and Cleanup

Create endpoints for deleting tracks:

- Verify owner
- Delete storage object
- Soft-delete or hard-delete DB row per policy
- Record deletion in `broadcast_history`/audit log

## Step 9: Add Upload Security Guards

- Sanitize filenames and disallow path traversal
- Validate content-type and file signatures when possible
- Enforce rate limits for upload endpoints
- Return consistent redacted errors

## Step 10: Verification

Run:

```bash
pnpm dev
pnpm type-check
pnpm lint
```

Manual checks:

- [ ] Upload succeeds for valid authenticated user
- [ ] Upload blocked for unauthorized station
- [ ] Large file fails with clear message
- [ ] Track row persists with expected lifecycle states
- [ ] Processing is triggered after successful upload
- [ ] Delete flow removes storage object and updates DB

## Troubleshooting

### Issue: Upload returns 403

**Solution:** Re-check storage bucket policies and signed URL generation context.

### Issue: File uploaded but DB record missing

**Solution:** Add transactional confirm endpoint and reconciliation job for orphaned files.

### Issue: Upload stalls on slow networks

**Solution:** Use chunked upload strategy and progress heartbeat updates.

## Next Steps

Proceed to `API_ROUTES.md` for canonical endpoint definitions, request/response contracts, and error handling conventions.

**Estimated Time:** 4-6 hours  
**Last Updated:** February 14, 2026

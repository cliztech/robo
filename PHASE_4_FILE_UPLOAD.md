# Phase 4 - File Upload & Media Pipeline (Day 8-10)

## Goal

Build reliable multi-file upload and processing workflows for audio tracks and artwork with progress, retries, and metadata extraction.

## Deliverables

- Drag-and-drop uploader components
- Backend upload API and signed URL flow
- FFprobe metadata extraction and validation
- Waveform generation job
- Processing status updates in realtime

## Upload Workflow

1. User selects files (drag/drop or picker).
2. Client validates size/type before upload.
3. API issues signed upload target.
4. Client uploads to Supabase Storage.
5. API creates `tracks` row with `processing` status.
6. Worker extracts metadata and waveform.
7. Status flips to `ready` or `failed`.

## Constraints

- Accepted formats: `mp3`, `wav`, `flac`, `m4a`, `aac`, `ogg`.
- Max single file size: configurable (recommended 500MB).
- Batch uploads supported with per-file progress.
- Duplicate fingerprint detection (optional but recommended).

## Required Modules

- `src/components/upload/FileUploader.tsx`
- `src/components/upload/UploadProgress.tsx`
- `src/lib/upload/upload-service.ts`
- `src/app/api/tracks/upload/route.ts`
- `src/app/api/tracks/analyze/route.ts`

## Server-side processing

Use FFprobe for:
- Duration
- Bitrate
- Sample rate
- Codec/container

Use FFmpeg for:
- Preview clip generation (optional)
- Waveform data JSON
- Artwork extraction fallback

## Error Handling

- Surface user-readable failure reason.
- Automatic retries with capped exponential backoff.
- Mark permanently failed files with recovery actions.
- Keep partial batch success (do not fail whole batch).

## Security

- Validate MIME and extension.
- Virus scan hook if available.
- Signed URL expiry <= 10 minutes.
- Enforce station membership on every upload endpoint.

## Verification

```bash
pnpm test -- upload-service
pnpm test:e2e --grep upload
pnpm type-check
```

Manual checks:
- Upload 1 small file, 1 large file, and invalid file.
- Interrupt network during upload and verify retry.
- Confirm processing status transitions in UI.

## Exit Criteria

- 95%+ successful upload rate in staging tests.
- Accurate metadata extracted for supported formats.
- Clear progress and failure states in UX.

Last Updated: February 14, 2026

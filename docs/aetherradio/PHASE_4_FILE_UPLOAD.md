# Phase 4 — File Upload & Storage (Day 8–10)

## Objectives

- Implement secure batch file upload to Supabase Storage
- Extract metadata/waveform data after upload
- Track per-file status and error reporting

## Flow

1. Client validates file type and size.
2. Upload begins with progress tracking.
3. Server finalizes metadata extraction (FFprobe).
4. Track record is inserted into database.
5. Optional AI analysis is queued.

## Requirements

- Supported formats: MP3, WAV, FLAC, AAC, OGG
- Per-station storage paths
- Signed URL access for private assets
- Retry strategy for transient failures

## Validation

```bash
pnpm test tests/unit/upload-service.test.ts
pnpm test tests/e2e/upload.spec.ts
```

## Exit Criteria

- Single and batch uploads succeed
- Upload failures return actionable errors
- Uploaded tracks appear in station library with metadata

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

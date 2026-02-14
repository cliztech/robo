# Phase 4 — File Upload & Storage (Day 8–10)

## Goals

- Reliable upload pipeline for large audio files
- Automated metadata extraction and analysis kickoff

## Workflow

1. Validate file type/size client-side
2. Upload to Supabase Storage (resumable)
3. Trigger metadata extraction API
4. Persist normalized track row
5. Generate waveform + optional artwork extraction

## UX Requirements

- Drag-and-drop batch upload
- Per-file progress bars
- Retry failed uploads
- Error summaries for partial failure

## Validation

```bash
pnpm test -- upload-service
pnpm test:e2e -- upload.spec.ts
```

## Exit Criteria

- Multi-file uploads complete with clear feedback
- Track appears in station library with metadata

_Last updated: 2026-02-14_

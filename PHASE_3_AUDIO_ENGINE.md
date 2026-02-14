# Phase 3: Audio Engine Integration

**Timeline**: Day 6-8  
**Goal**: Implement audio processing, normalization, metadata extraction, and queue-ready assets

## Prerequisites

- [ ] Phase 2 authentication complete
- [ ] FFmpeg installed and available in PATH
- [ ] Upload flow scaffolded
- [ ] Storage buckets configured in Supabase

## Step 1: Verify FFmpeg Runtime

```bash
ffmpeg -version
ffprobe -version
```

Ensure required codecs are available (`libmp3lame`, `aac`, `opus`, `flac`).

## Step 2: Create Audio Service Module

Create `src/lib/audio/processor.ts` with functions for:

- Probe metadata (`duration`, `sample rate`, `bitrate`, `channels`)
- Normalize loudness (target LUFS)
- Transcode to streaming-friendly format
- Generate waveform data for UI previews

## Step 3: Add Audio Constants

Create `src/lib/audio/constants.ts`:

```ts
export const AUDIO_LIMITS = {
  maxUploadBytes: 500 * 1024 * 1024,
  minDurationSeconds: 3,
  maxDurationSeconds: 60 * 60 * 3,
}

export const TRANSCODE_PRESET = {
  codec: 'mp3',
  sampleRate: 44100,
  bitrate: '192k',
  channels: 2,
}
```

## Step 4: Implement Metadata Extraction

Use `ffprobe` output to capture:

- Duration
- Codec
- Bitrate
- Sample rate
- Channel count
- Embedded tags (artist, title, album)

Persist normalized metadata to `tracks` table.

## Step 5: Implement Loudness Normalization

Apply two-pass loudnorm or safe single-pass profile:

```bash
ffmpeg -i input.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 output.mp3
```

Store:

- Integrated loudness
- True peak
- Loudness range
- Processing profile version

## Step 6: Build Transcoding Pipeline

Target outputs:

- Master archive format (original)
- Broadcast format (`mp3`, `192k`, stereo)
- Optional low-bitrate preview

Recommended strategy:

1. Validate input
2. Probe metadata
3. Normalize
4. Transcode
5. Verify output integrity
6. Upload artifacts to storage

## Step 7: Add Track Validation

Reject unsupported files with clear errors:

- Unsupported codec/container
- Corrupt file
- Excessive duration
- Over-size upload
- Silent/near-silent files (optional threshold)

## Step 8: Create Track Queue Utilities

Create `src/lib/audio/queue.ts` helpers for:

- Building playout-safe queue objects
- Calculating projected end times
- Enforcing no-overlap + minimum gap rules
- Marking fallback track when queue is depleted

## Step 9: Add API Route for Audio Processing

Create `src/app/api/audio/process/route.ts`:

- Accepts track reference or upload token
- Runs processing pipeline
- Updates `tracks.processing_status`
- Returns job result payload

## Step 10: Observability and Retries

Track each processing stage:

- `queued`
- `processing`
- `completed`
- `failed`

Add retry policy with capped attempts and structured error codes.

## Step 11: Verification

Run:

```bash
pnpm type-check
pnpm lint
```

Manual checks:

- [ ] MP3 upload processes end-to-end
- [ ] WAV upload transcodes successfully
- [ ] Invalid file returns actionable error
- [ ] Metadata persisted correctly
- [ ] Normalized file plays in browser audio element
- [ ] Queue helper computes valid timing

## Troubleshooting

### Issue: `ffmpeg ENOENT`

**Solution:** Ensure FFmpeg is installed on deployment environment and executable is in PATH.

### Issue: Audio sounds clipped

**Solution:** Lower target true peak and recheck loudnorm settings.

### Issue: Processing jobs time out

**Solution:** Move heavy processing to background workers and return async job IDs.

## Next Steps

Proceed to `PHASE_4_FILE_UPLOAD.md` to implement robust upload UX and storage lifecycle management.

**Estimated Time:** 6-8 hours  
**Last Updated:** February 14, 2026

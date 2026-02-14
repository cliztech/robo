# Phase 3: Audio Engine & Processing Pipeline

**Timeline**: Day 6-8  
**Goal**: Implement robust audio validation, metadata extraction, loudness normalization, and processing lifecycle

## Prerequisites

- [ ] Phases 0-2 completed
- [ ] FFmpeg and ffprobe installed and available in PATH
- [ ] `tracks` table includes analysis/processing columns
- [ ] File upload foundation is available

## Step 1: Verify FFmpeg Tooling

Run:

```bash
ffmpeg -version
ffprobe -version
```

If commands fail, install FFmpeg and update PATH before continuing.

## Step 2: Define Audio Types

Create `src/types/audio.ts` with core types:

- `AudioCodec`
- `AudioMetadata`
- `LoudnessMetrics`
- `AudioValidationResult`
- `ProcessingStatus`

## Step 3: Implement FFprobe Metadata Reader

Create `src/lib/audio/metadata.ts`:

- Read duration, bitrate, sample rate, channels, codec
- Parse and normalize ffprobe output
- Throw typed errors with useful context

Recommended ffprobe command:

```bash
ffprobe -v quiet -print_format json -show_format -show_streams <input-file>
```

## Step 4: Implement Validation Rules

Create `src/lib/audio/validate.ts` and enforce:

- Allowed extensions: `.mp3`, `.wav`, `.flac`, `.aac`, `.m4a`, `.ogg`
- Max file size: `500MB`
- Min duration: `5` seconds
- Max duration: `4` hours
- Valid audio stream must exist

Return structured validation errors suitable for UI display.

## Step 5: Implement Normalization + Transcoding

Create `src/lib/audio/ffmpeg.ts` with utilities:

- `normalizeLoudness(input, output)` using EBU R128 `loudnorm`
- `transcodeToMp3(input, output)`
- `transcodeToAac(input, output)` (optional)

Recommended defaults:

- Sample rate: `44100`
- Channels: `2`
- MP3 bitrate: `192k`
- Loudness target: `-14 LUFS`
- True peak: `-1.0 dBTP`

Example normalization command:

```bash
ffmpeg -i input.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 44100 -ac 2 output.mp3
```

## Step 6: Create Processing Queue Contract

Create `src/lib/audio/queue.ts`:

- `enqueueTrackProcessing(trackId: string)`
- `processTrack(trackId: string)`
- `getProcessingStatus(trackId: string)`

Define statuses:

- `pending`
- `processing`
- `ready`
- `failed`

## Step 7: Persist Processing Outputs

Store in `tracks`:

- `duration_seconds`
- `sample_rate`
- `channels`
- `codec`
- `bitrate`
- `loudness_lufs`
- `peak_db`
- `processing_status`
- `processing_error` (nullable)

## Step 8: Add Audio Processing API Endpoint

Create `src/app/api/audio/process/route.ts`:

- Input: `trackId`
- Validate requester ownership of track/station
- Enqueue async processing
- Return status payload

Expected response:

```json
{
  "success": true,
  "data": {
    "trackId": "uuid",
    "status": "pending"
  },
  "error": null
}
```

## Step 9: Waveform Placeholder Output

Generate coarse waveform data for UI preview:

- Target buckets: `256`
- Output path: `waveforms/{station_id}/{track_id}.json`
- Include min/max or RMS per bucket

## Step 10: Verify Audio Pipeline

Run:

```bash
pnpm type-check
pnpm lint
```

Manual checks:

- [ ] Upload a valid track and see `pending → processing → ready`
- [ ] Invalid track is rejected with clear error
- [ ] Metadata fields persist correctly
- [ ] Normalized output file is produced
- [ ] Failed processing stores `processing_error`

## Troubleshooting

### Issue: ffmpeg works in terminal but not app runtime

**Fix:** Confirm runtime environment PATH includes FFmpeg binaries.

### Issue: Audio file accepted but fails in processing

**Fix:** Run ffprobe preflight validation and verify output directory write permissions.

### Issue: Processing is too slow

**Fix:** Move heavy tasks to worker queue and keep API responses async.

## Exit Criteria

Before moving to Phase 4:

- [ ] Validation guards are implemented
- [ ] Metadata extraction and persistence are working
- [ ] Loudness normalization produces expected output
- [ ] Processing statuses are visible via API/UI

## Next Step

Proceed to **PHASE_4_FILE_UPLOAD.md**.

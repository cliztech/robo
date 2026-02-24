# Phase 6: Playlist Generation

## Status

✅ Implemented

## Scope Delivered

- AI-informed playlist generation service (`backend/playlist_service.py`)
- Time-of-day aware genre and energy targeting
- Transition quality scoring using BPM, mood, artist, and genre continuity
- Artist repeat-avoidance window
- Hard transition constraints (`max_bpm_delta`, `max_consecutive_same_genre`)
- Duration-aware packing (`target_duration_seconds`)
- Per-track selection reason telemetry
- Energy curve controls (`build`, `steady`, `cooldown`)
- Auth-protected API endpoint: `POST /api/v1/ai/generate-playlist`

## Request Contract

```json
{
  "tracks": [
    {
      "id": "track_1",
      "title": "Track Title",
      "artist": "Artist",
      "genre": "house",
      "mood": "energetic",
      "energy": 8,
      "bpm": 126,
      "duration_seconds": 196
    }
  ],
  "desired_count": 12,
  "start_hour": 18,
  "energy_curve": "build",
  "avoid_recent_artist_window": 2,
  "preferred_genres": ["house", "dance"],
  "max_bpm_delta": 18,
  "max_consecutive_same_genre": 2,
  "target_duration_seconds": 3600
}
```

## Response Contract

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "track_id": "track_1",
        "title": "Track Title",
        "artist": "Artist",
        "genre": "house",
        "mood": "energetic",
        "energy": 8,
        "bpm": 126,
        "duration_seconds": 196,
        "transition_score": 0.92,
        "selection_reason": "target_energy=8, matched_preferred_genre, transition=0.92"
      }
    ],
    "average_transition_score": 0.88,
    "energy_flow_score": 0.91,
    "total_duration_seconds": 3472
  },
  "error": null
}
```

## Validation

- Unit tests: `backend/tests/test_playlist_service.py`
- API tests: `backend/tests/test_playlist_api.py`

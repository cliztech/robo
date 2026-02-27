from backend.playlist_service import PlaylistGenerationRequest, PlaylistGenerationService


def _track(idx: int, artist: str, genre: str, mood: str, energy: int, bpm: int, duration_seconds: int = 180) -> dict:
    return {
        "id": f"track_{idx}",
        "title": f"Track {idx}",
        "artist": artist,
        "genre": genre,
        "mood": mood,
        "energy": energy,
        "bpm": bpm,
        "duration_seconds": duration_seconds,
    }


def test_generate_respects_count_and_unique_tracks():
    service = PlaylistGenerationService()
    request = PlaylistGenerationRequest(
        tracks=[
            _track(1, "A", "pop", "uplifting", 6, 120),
            _track(2, "B", "pop", "uplifting", 7, 122),
            _track(3, "C", "rock", "aggressive", 8, 130),
            _track(4, "D", "house", "energetic", 8, 128),
        ],
        desired_count=3,
        energy_curve="build",
    )

    result = service.generate(request)

    assert len(result.entries) == 3
    assert len({entry.track_id for entry in result.entries}) == 3
    assert all(entry.selection_reason for entry in result.entries)
    assert result.total_duration_seconds == sum(entry.duration_seconds for entry in result.entries)
    assert 0 <= result.average_transition_score <= 1
    assert 0 <= result.energy_flow_score <= 1


def test_avoids_recent_artist_repeats_when_possible():
    service = PlaylistGenerationService()
    request = PlaylistGenerationRequest(
        tracks=[
            _track(1, "Repeat", "dance", "energetic", 7, 124),
            _track(2, "Repeat", "dance", "energetic", 8, 126),
            _track(3, "Other", "dance", "energetic", 7, 125),
        ],
        desired_count=3,
        avoid_recent_artist_window=1,
    )

    result = service.generate(request)

    assert result.entries[0].artist != result.entries[1].artist


def test_artist_repeat_detection_normalizes_case_and_whitespace():
    service = PlaylistGenerationService()
    request = PlaylistGenerationRequest(
        tracks=[
            _track(1, " Artist One ", "dance", "energetic", 7, 124),
            _track(2, "artist one", "dance", "energetic", 8, 126),
            _track(3, "Other", "dance", "energetic", 7, 125),
        ],
        desired_count=2,
        avoid_recent_artist_window=1,
    )

    result = service.generate(request)

    assert service._normalize_artist(result.entries[0].artist) != service._normalize_artist(
        result.entries[1].artist
    )


def test_respects_max_bpm_delta_when_candidates_available():
    service = PlaylistGenerationService()
    request = PlaylistGenerationRequest(
        tracks=[
            _track(1, "A", "house", "energetic", 7, 100),
            _track(2, "B", "house", "energetic", 7, 110),
            _track(3, "C", "house", "energetic", 7, 150),
        ],
        desired_count=2,
        max_bpm_delta=15,
    )

    result = service.generate(request)
    assert abs(result.entries[0].bpm - result.entries[1].bpm) <= 15

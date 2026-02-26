from backend.track_analysis_service import TrackAnalysisRequest, TrackAnalysisService


def test_track_analysis_derives_profile_from_genre_hint() -> None:
    service = TrackAnalysisService()
    request = TrackAnalysisRequest(
        track_id="trk_001",
        metadata={
            "title": "Sunset Remix",
            "artist": "Nova",
            "duration_seconds": 210,
            "genre_hint": "house",
        },
        audio_features={"bitrate_kbps": 256, "sample_rate_hz": 44100, "channels": 2},
    )

    result = service.analyze(request)

    assert result.track_id == "trk_001"
    assert result.analysis.genre == "house"
    assert result.analysis.energy_level >= 8
    assert result.analysis.danceability >= 9
    assert result.analysis.confidence_score >= 0.8


def test_track_analysis_handles_missing_genre_hint() -> None:
    service = TrackAnalysisService()
    request = TrackAnalysisRequest(
        track_id="trk_002",
        metadata={
            "title": "Night Drift Instrumental",
            "artist": "Echo Unit",
            "duration_seconds": 460,
        },
    )

    result = service.analyze(request)

    assert result.analysis.genre == "pop"
    assert result.analysis.vocal_style == "instrumental"
    assert 1 <= result.analysis.energy_level <= 10


def test_track_analysis_cache_hit_for_identical_requests() -> None:
    service = TrackAnalysisService()
    request = TrackAnalysisRequest(
        track_id="trk_cache_001",
        metadata={
            "title": "Skyline",
            "artist": "Atlas",
            "duration_seconds": 198,
            "genre_hint": "dance",
        },
        audio_features={"bitrate_kbps": 320, "sample_rate_hz": 48000, "channels": 2},
        model_version="track-analysis-v2",
        prompt_profile_version="prompt-profile-2026-02",
    )

    first = service.analyze(request)
    second = service.analyze(request)

    assert first == second


def test_track_analysis_cache_miss_when_prompt_profile_version_changes() -> None:
    service = TrackAnalysisService()
    base_payload = {
        "track_id": "trk_cache_002",
        "metadata": {
            "title": "Ocean Pulse",
            "artist": "Helios",
            "duration_seconds": 240,
            "genre_hint": "house",
        },
        "audio_features": {"bitrate_kbps": 256, "sample_rate_hz": 44100, "channels": 2},
        "model_version": "track-analysis-v2",
    }

    request_a = TrackAnalysisRequest(**base_payload, prompt_profile_version="prompt-profile-a")
    request_b = TrackAnalysisRequest(**base_payload, prompt_profile_version="prompt-profile-b")

    service.analyze(request_a)
    fingerprint_a = service._fingerprint(request_a)
    fingerprint_b = service._fingerprint(request_b)

    assert fingerprint_a != fingerprint_b


def test_track_analysis_cache_miss_when_track_input_changes() -> None:
    service = TrackAnalysisService()
    base_payload = {
        "track_id": "trk_cache_003",
        "metadata": {
            "title": "Midnight Drive",
            "artist": "Pulse Unit",
            "duration_seconds": 205,
            "genre_hint": "edm",
        },
        "audio_features": {"bitrate_kbps": 192, "sample_rate_hz": 44100, "channels": 2},
        "model_version": "track-analysis-v2",
        "prompt_profile_version": "prompt-profile-2026-02",
    }

    request_a = TrackAnalysisRequest(**base_payload)
    request_b = TrackAnalysisRequest(
        **{
            **base_payload,
            "metadata": {**base_payload["metadata"], "title": "Midnight Drive Extended"},
        }
    )

    service.analyze(request_a)
    fingerprint_a = service._fingerprint(request_a)
    fingerprint_b = service._fingerprint(request_b)

    assert fingerprint_a != fingerprint_b

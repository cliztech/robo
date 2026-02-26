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

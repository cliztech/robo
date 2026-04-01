from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from backend.ai.contracts.track_analysis import AnalysisStatus, TrackAnalysisRequest
from backend.track_analysis_service import InMemoryAnalysisCacheStore, TrackAnalysisService


def _request(**overrides: object) -> TrackAnalysisRequest:
    payload: dict[str, object] = {
        "track_id": "trk_001",
        "metadata": {
            "title": "Sunset Remix",
            "artist": "Nova",
            "duration_seconds": 210,
            "genre_hint": "house",
        },
        "audio_features": {"bitrate_kbps": 256, "sample_rate_hz": 44100, "channels": 2},
        "model_version": "track-analysis-v2",
        "prompt_profile_version": "prompt-profile-2026-02",
        "schema_version": "track-analysis-schema-v1",
    }
    payload.update(overrides)
    return TrackAnalysisRequest(**payload)


def test_track_analysis_derives_profile_from_genre_hint() -> None:
    service = TrackAnalysisService()
    result = service.analyze(_request())

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


def test_track_analysis_uses_canonical_contract_status() -> None:
    service = TrackAnalysisService()
    result = service.analyze(
        TrackAnalysisRequest(
            track_id="trk_status",
            metadata={"title": "Pulse", "artist": "Unit", "duration_seconds": 180, "genre_hint": "edm"},
        )
    )

    assert result.analysis.status is AnalysisStatus.SUCCESS


def test_track_analysis_cache_hit_for_identical_requests() -> None:
    service = TrackAnalysisService()
    request = _request(track_id="trk_cache_001", metadata={
        "title": "Skyline",
        "artist": "Atlas",
        "duration_seconds": 198,
        "genre_hint": "dance",
    }, audio_features={"bitrate_kbps": 320, "sample_rate_hz": 48000, "channels": 2})

    with patch.object(service, "_resolve_genre", wraps=service._resolve_genre) as mock_resolve:
        first = service.analyze(request)
        second = service.analyze(request)

        assert first == second
        mock_resolve.assert_called_once()


def test_track_analysis_cache_miss_when_prompt_profile_version_changes() -> None:
    service = TrackAnalysisService()
    request_a = _request(track_id="trk_cache_002", prompt_profile_version="prompt-profile-a")
    request_b = _request(track_id="trk_cache_002", prompt_profile_version="prompt-profile-b")

    service.analyze(request_a)
    fingerprint_a = service._fingerprint(request_a)
    fingerprint_b = service._fingerprint(request_b)

    assert fingerprint_a != fingerprint_b


def test_track_analysis_cache_miss_when_track_input_changes() -> None:
    service = TrackAnalysisService()
    request_a = _request(track_id="trk_cache_003", metadata={
        "title": "Midnight Drive",
        "artist": "Pulse Unit",
        "duration_seconds": 205,
        "genre_hint": "edm",
    }, audio_features={"bitrate_kbps": 192, "sample_rate_hz": 44100, "channels": 2})
    request_b = _request(track_id="trk_cache_003", metadata={
        "title": "Midnight Drive Extended",
        "artist": "Pulse Unit",
        "duration_seconds": 205,
        "genre_hint": "edm",
    }, audio_features={"bitrate_kbps": 192, "sample_rate_hz": 44100, "channels": 2})

    service.analyze(request_a)
    fingerprint_a = service._fingerprint(request_a)
    fingerprint_b = service._fingerprint(request_b)

    assert fingerprint_a != fingerprint_b


def test_in_memory_cache_expires_entries_by_ttl(monkeypatch) -> None:
    baseline = datetime(2026, 1, 1, tzinfo=timezone.utc)
    store = InMemoryAnalysisCacheStore(ttl_seconds=5, max_entries=10)
    request = _request(track_id="trk_ttl")
    result = TrackAnalysisService().analyze(request)

    monkeypatch.setattr(InMemoryAnalysisCacheStore, "_now", staticmethod(lambda: baseline))
    store.set("fingerprint", result)
    assert store.get("fingerprint") is not None

    monkeypatch.setattr(
        InMemoryAnalysisCacheStore,
        "_now",
        staticmethod(lambda: baseline + timedelta(seconds=6)),
    )
    assert store.get("fingerprint") is None

    metrics = store.metrics()
    assert metrics["expirations"] == 1
    assert metrics["size"] == 0


def test_in_memory_cache_evicts_lru_when_max_entries_reached() -> None:
    store = InMemoryAnalysisCacheStore(max_entries=2, eviction_policy="lru")
    service = TrackAnalysisService(cache_store=store)

    request_a = _request(track_id="trk_a")
    request_b = _request(track_id="trk_b")
    request_c = _request(track_id="trk_c")

    service.analyze(request_a)
    service.analyze(request_b)
    service.analyze(request_a)
    service.analyze(request_c)

    assert store.get(service._fingerprint(request_b)) is None
    assert store.get(service._fingerprint(request_a)) is not None

    metrics = store.metrics()
    assert metrics["evictions"] == 1
    assert metrics["size"] == 2


def test_track_analysis_fingerprint_changes_when_schema_or_model_version_changes() -> None:
    service = TrackAnalysisService()
    request_a = _request(track_id="trk_version", model_version="track-analysis-v2", schema_version="schema-v1")
    request_b = _request(track_id="trk_version", model_version="track-analysis-v3", schema_version="schema-v1")
    request_c = _request(track_id="trk_version", model_version="track-analysis-v2", schema_version="schema-v2")

    fingerprint_a = service._fingerprint(request_a)
    fingerprint_b = service._fingerprint(request_b)
    fingerprint_c = service._fingerprint(request_c)

    assert fingerprint_a != fingerprint_b
    assert fingerprint_a != fingerprint_c

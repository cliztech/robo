import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from backend.ai.contracts.track_analysis import AnalysisStatus
from backend.app import app

TEST_API_KEY = os.environ.get("TEST_API_KEY", "valid_api_key_for_testing")


@pytest.fixture(autouse=True)
def mock_env_api_key():
    with mock.patch.dict(
        os.environ,
        {"ROBODJ_SECRET_KEY": TEST_API_KEY, "ROBODJ_SCHEDULER_API_KEY": TEST_API_KEY},
        clear=False,
    ):
        yield


@pytest.fixture(autouse=True)
def clear_auth_cache():
    from backend.security.auth import _get_secret_key

    _get_secret_key.cache_clear()
    yield
    _get_secret_key.cache_clear()


def _canonical_payload() -> dict:
    return {
        "track_id": "trk_010",
        "metadata": {
            "title": "Neon Skyline",
            "artist": "Bytewave",
            "duration_seconds": 245,
            "genre_hint": "dance",
        },
        "audio_features": {"bitrate_kbps": 256, "sample_rate_hz": 44100, "channels": 2, "bpm": 120},
    }


def test_canonical_track_analysis_route_success() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json=_canonical_payload(),
        headers={"X-API-Key": TEST_API_KEY, "X-Correlation-ID": "corr-canonical"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["success"] is True
    assert body["error"] is None
    assert body["correlation_id"] == "corr-canonical"
    assert response.headers["X-Correlation-ID"] == "corr-canonical"
    assert body["data"]["track_id"] == "trk_010"
    assert body["data"]["analysis"]["genre"] == "dance"
    assert body["data"]["analysis"]["status"] == AnalysisStatus.SUCCESS.value


def test_legacy_alias_forwards_to_canonical_contract_with_deprecation_headers() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/analyze-track",
        json=_canonical_payload(),
        headers={"X-API-Key": TEST_API_KEY, "X-Correlation-ID": "corr-legacy"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["success"] is True
    assert body["error"] is None
    assert body["correlation_id"] == "corr-legacy"
    assert response.headers["X-Correlation-ID"] == "corr-legacy"
    assert response.headers["Deprecation"] == "true"
    assert "Deprecated endpoint: use /api/v1/ai/track-analysis" in response.headers["Warning"]


def test_track_analysis_requires_api_key() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json=_canonical_payload(),
    )
    assert response.status_code == 401


def test_track_analysis_rejects_invalid_api_key() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json=_canonical_payload(),
        headers={"X-API-Key": "wrong"},
    )
    assert response.status_code == 401

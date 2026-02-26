import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.track_analysis_api import get_track_analysis_service
from backend.ai.contracts.track_analysis import AnalysisStatus
from backend.track_analysis_service import TrackAnalysisService

TEST_API_KEY = "valid_api_key_for_testing"


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


class _StubService(TrackAnalysisService):
    def analyze(self, request):  # noqa: ANN001
        return super().analyze(request)


def test_analyze_track_requires_api_key() -> None:
    client = TestClient(app)
    response = client.post("/api/v1/ai/analyze-track", json={})
    assert response.status_code == 401


def test_analyze_track_returns_envelope() -> None:
    app.dependency_overrides[get_track_analysis_service] = lambda: _StubService()
    client = TestClient(app)
    payload = {
        "track_id": "trk_010",
        "metadata": {
            "title": "Golden Hour",
            "artist": "DJ Arc",
            "duration_seconds": 198,
            "genre_hint": "dance",
        },
        "audio_features": {"bitrate_kbps": 256, "sample_rate_hz": 44100, "channels": 2},
    }

    try:
        response = client.post(
            "/api/v1/ai/analyze-track",
            json=payload,
            headers={"X-API-Key": TEST_API_KEY},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["track_id"] == "trk_010"
    assert body["data"]["analysis"]["genre"] == "dance"
    assert body["data"]["analysis"]["status"] == AnalysisStatus.SUCCESS.value

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


class _DegradedStubService(TrackAnalysisService):
    def analyze(self, request):  # noqa: ANN001
        raise ValueError("contract fallback: missing optional enrichment")


class _FailedStubService(TrackAnalysisService):
    def analyze(self, request):  # noqa: ANN001
        raise TimeoutError("analysis timed out")


def test_analyze_track_requires_api_key() -> None:
def test_track_analysis_requires_api_key() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json={
            "title": "Neon Skyline",
            "artist": "Bytewave",
            "genre": "Synthwave",
            "bpm": 118,
            "duration_seconds": 245,
            "notes": "night drive",
        },
    )
    assert response.status_code == 401


def test_track_analysis_rejects_invalid_api_key() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json={
            "title": "Neon Skyline",
            "artist": "Bytewave",
            "genre": "Synthwave",
            "bpm": 118,
            "duration_seconds": 245,
            "notes": "night drive",
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
    assert body["status"] == "success"
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["track_id"] == "trk_010"
    assert body["data"]["analysis"]["genre"] == "dance"
    assert body["data"]["analysis"]["status"] == AnalysisStatus.SUCCESS.value


def test_analyze_track_returns_degraded_on_contract_fallback() -> None:
    app.dependency_overrides[get_track_analysis_service] = lambda: _DegradedStubService()
    client = TestClient(app)
    payload = {
        "track_id": "trk_011",
        "metadata": {
            "title": "Fallback Lane",
            "artist": "DJ Arc",
            "duration_seconds": 198,
        },
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
    assert body["status"] == "degraded"
    assert body["success"] is True
    assert body["data"] is None
    assert "contract fallback" in body["error"]


def test_analyze_track_returns_failed_on_timeout() -> None:
    app.dependency_overrides[get_track_analysis_service] = lambda: _FailedStubService()
    client = TestClient(app)
    payload = {
        "track_id": "trk_012",
        "metadata": {
            "title": "Timeout Road",
            "artist": "DJ Arc",
            "duration_seconds": 198,
        },
    }

    try:
        response = client.post(
            "/api/v1/ai/analyze-track",
            json=payload,
            headers={"X-API-Key": TEST_API_KEY},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 504
    body = response.json()
    assert body["status"] == "failed"
    assert body["success"] is False
    assert body["data"] is None
    assert "timed out" in body["error"]
        headers={"X-API-Key": "wrong"},
    )
    assert response.status_code == 401

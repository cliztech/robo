import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.playlist_api import get_playlist_service
from backend.playlist_service import PlaylistGenerationService

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


def test_generate_playlist_requires_api_key():
    client = TestClient(app)
    response = client.post("/api/v1/ai/generate-playlist", json={})
    assert response.status_code == 401


class _StubService(PlaylistGenerationService):
    def generate(self, request):  # noqa: ANN001
        return super().generate(request)


def test_generate_playlist_returns_envelope():
    app.dependency_overrides[get_playlist_service] = lambda: _StubService()
    client = TestClient(app)
    payload = {
        "tracks": [
            {
                "id": "a",
                "title": "Alpha",
                "artist": "One",
                "genre": "pop",
                "mood": "uplifting",
                "energy": 6,
                "bpm": 120,
                "duration_seconds": 180,
            },
            {
                "id": "b",
                "title": "Beta",
                "artist": "Two",
                "genre": "house",
                "mood": "energetic",
                "energy": 8,
                "bpm": 126,
                "duration_seconds": 190,
            },
        ],
        "desired_count": 2,
        "energy_curve": "steady",
    }

    try:
        response = client.post(
            "/api/v1/ai/generate-playlist",
            json=payload,
            headers={"X-API-Key": TEST_API_KEY},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None
    assert len(body["data"]["entries"]) == 2
    assert body["data"]["total_duration_seconds"] == 370
    assert body["data"]["entries"][0]["selection_reason"]

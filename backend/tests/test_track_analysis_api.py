import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from backend.app import app

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
        headers={"X-API-Key": "wrong"},
    )
    assert response.status_code == 401

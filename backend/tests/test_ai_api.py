import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from backend.ai_service import (
    AICircuitBreaker,
    AICircuitOpenError,
    AIInferenceService,
    AITimeoutError,
    HostScriptRequest,
    TrackAnalysisRequest,
)
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


def test_track_analysis_contract_success() -> None:
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
        headers={"X-Correlation-ID": "corr-track-001", "X-API-Key": TEST_API_KEY},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["correlation_id"] == "corr-track-001"
    assert body["data"]["mood"] in {"uplifting", "moody", "chill", "energetic", "dark"}
    assert isinstance(body["latency_ms"], int)
    assert body["cost_usd"] >= 0


def test_host_script_contract_validation_error() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/host-script",
        json={
            "message_type": "commentary",
            "prompt": "x",
            "persona_name": "DGN",
            "persona_style": "edgy",
            "voice": "bass",
        },
    )

    assert response.status_code == 422


def test_timeout_failure_handling() -> None:
    service = AIInferenceService(timeout_seconds=0.001)

    def _slow_invoke(*_args, **_kwargs):
        import time

        time.sleep(0.05)
        return None

    service._invoke_model = _slow_invoke  # type: ignore[method-assign]

    request = HostScriptRequest(
        message_type="intro",
        prompt="hello from timeout test",
        persona_name="DGN",
        persona_style="neutral",
        voice="bass",
    )

    try:
        service.generate_host_script(request, correlation_id="timeout-1")
    except AITimeoutError as exc:
        assert "timed out" in str(exc)
    else:
        raise AssertionError("expected timeout exception")


def test_circuit_breaker_blocks_after_failure() -> None:
    breaker = AICircuitBreaker(failure_threshold=1, reset_timeout_seconds=60)
    service = AIInferenceService(timeout_seconds=0.1, circuit_breaker=breaker)

    def _raise(*_args, **_kwargs):
        raise RuntimeError("boom")

    service._invoke_model = _raise  # type: ignore[method-assign]
    request = TrackAnalysisRequest(
        title="A",
        artist="B",
        genre="C",
        bpm=100,
        duration_seconds=120,
        notes="n",
    )

    try:
        service.analyze_track(request, correlation_id="cb-1")
    except Exception:
        pass

    try:
        service.analyze_track(request, correlation_id="cb-2")
    except AICircuitOpenError as exc:
        assert "circuit breaker open" in str(exc)
    else:
        raise AssertionError("expected circuit open exception")

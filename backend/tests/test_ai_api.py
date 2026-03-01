import os
from unittest import mock
import logging

import pytest
from fastapi.testclient import TestClient

from backend.ai.contracts.track_analysis import AnalysisStatus, TrackAnalysisRequest
from backend.ai_service import AICircuitBreaker, AICircuitOpenError, AIInferenceService, HostScriptRequest
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


def test_track_analysis_contract_success() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/track-analysis",
        json={
            "track_id": "trk-001",
            "metadata": {
                "title": "Neon Skyline",
                "artist": "Bytewave",
                "genre_hint": "Synthwave",
                "duration_seconds": 245
            },
            "audio_features": {
                "bpm": 118
            }
        },
        headers={"X-Correlation-ID": "corr-track-001", "X-API-Key": TEST_API_KEY},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["status"] == "success"
    assert body["correlation_id"] == "corr-track-001"
    assert response.headers["X-Correlation-ID"] == "corr-track-001"
    assert body["data"]["track_id"] == "trk-001"
    assert body["data"]["analysis"]["genre"] == "synthwave"
    assert body["data"]["analysis"]["status"] == AnalysisStatus.SUCCESS.value
    assert isinstance(body["latency_ms"], int)
    assert body["cost_usd"] >= 0
    assert body["prompt_profile_version"]


def test_track_analysis_cache_hit() -> None:
    service = AIInferenceService(timeout_seconds=0.1)
    request = TrackAnalysisRequest(
        track_id="trk-cache-001",
        metadata={
            "title": "Neon Skyline",
            "artist": "Bytewave",
            "genre_hint": "Synthwave",
            "duration_seconds": 245,
        },
        audio_features={"bpm": 118},
    )

    _, _, _, first_cache_hit, _, _ = service.analyze_track(request, correlation_id="c1")
    _, _, _, second_cache_hit, _, _ = service.analyze_track(request, correlation_id="c2")

    assert first_cache_hit is False
    assert second_cache_hit is True


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


def test_timeout_returns_degraded_fallback() -> None:
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

    result, _latency_ms, cost_usd, status, _prompt_profile_version = service.generate_host_script(
        request,
        correlation_id="timeout-1",
    )
    assert status == "degraded"
    assert cost_usd == 0.0
    assert "fallback" in result.safety_flags


def test_circuit_breaker_blocks_after_failure() -> None:
    breaker = AICircuitBreaker(failure_threshold=1, reset_timeout_seconds=60)
    service = AIInferenceService(timeout_seconds=0.1, circuit_breaker=breaker)

    def _raise(*_args, **_kwargs):
        raise RuntimeError("boom")

    service._invoke_model = _raise  # type: ignore[method-assign]
    request = TrackAnalysisRequest(
        track_id="cb-track",
        metadata={"title": "A", "artist": "B", "genre_hint": "C", "duration_seconds": 120},
        audio_features={"bpm": 100},
    )

    try:
        service.analyze_track(request, correlation_id="cb-1")
    except Exception as e:
        logging.error(f"Ignored exception: {e}")

    try:
        service.analyze_track(request, correlation_id="cb-2")
    except AICircuitOpenError as exc:
        assert "circuit breaker open" in str(exc)
    else:
        raise AssertionError("expected circuit open exception")

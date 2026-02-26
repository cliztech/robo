from fastapi.testclient import TestClient

from backend.ai_service import (
    AICircuitBreaker,
    AICircuitOpenError,
    AIInferenceService,
    HostScriptRequest,
    TrackAnalysisRequest,
)
from backend.app import app


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
        headers={"X-Correlation-ID": "corr-track-001"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["status"] == "success"
    assert body["correlation_id"] == "corr-track-001"
    assert body["data"]["mood"] in {"uplifting", "moody", "chill", "energetic", "dark"}
    assert isinstance(body["latency_ms"], int)
    assert body["cost_usd"] >= 0
    assert body["prompt_profile_version"]


def test_track_analysis_cache_hit() -> None:
    service = AIInferenceService(timeout_seconds=0.1)
    request = TrackAnalysisRequest(
        title="Neon Skyline",
        artist="Bytewave",
        genre="Synthwave",
        bpm=118,
        duration_seconds=245,
        notes="night drive",
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

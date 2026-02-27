from statistics import median

from backend.ai_service import AIInferenceService, TrackAnalysisRequest


def test_track_analysis_latency_profile_smoke() -> None:
    service = AIInferenceService(timeout_seconds=0.2)
    request = TrackAnalysisRequest(
        title="Latency Track",
        artist="Profiler",
        genre="Ambient",
        bpm=96,
        duration_seconds=180,
        notes="latency smoke",
    )

    latencies = []
    for i in range(20):
        _, latency_ms, _, _, _, _ = service.analyze_track(request, correlation_id=f"lat-{i}")
        latencies.append(latency_ms)

    sorted_latencies = sorted(latencies)
    p50 = median(sorted_latencies)
    p95 = sorted_latencies[max(0, int(len(sorted_latencies) * 0.95) - 1)]

    # Cached calls should be near-zero; this guards accidental latency regressions.
    assert p50 <= 2
    assert p95 <= 10

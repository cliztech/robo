import importlib.util
import json
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[2] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
editorial_event_pipeline = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(editorial_event_pipeline)


def test_parse_float_falls_back_for_malformed_values():
    malformed_values = ["", "N/A", None, object()]

    for value in malformed_values:
        parsed = editorial_event_pipeline.parse_float(value, 0.42, source="test", field="confidence")
        assert parsed == 0.42


def test_adapters_normalize_malformed_numeric_fields_with_existing_defaults():
    malformed = {"confidence": "", "relevance": "N/A", "safety_score": object()}

    weather_event = editorial_event_pipeline.WeatherAdapter({}).normalize([malformed])[0]
    assert weather_event.confidence == 0.8
    assert weather_event.relevance_score == 0.7
    assert weather_event.safety_score == 0.98

    news_event = editorial_event_pipeline.NewsAdapter({}).normalize([malformed])[0]
    assert news_event.confidence == 0.75
    assert news_event.relevance_score == 0.6
    assert news_event.safety_score == 0.97

    trend_event = editorial_event_pipeline.TrendAdapter({}).normalize([malformed])[0]
    assert trend_event.confidence == 0.65
    assert trend_event.relevance_score == 0.5
    assert trend_event.safety_score == 0.9


def test_run_pipeline_returns_ranked_output_with_malformed_numeric_fields(tmp_path):
    sample_events = {
        "weather": [{"headline": "Wx", "confidence": "", "relevance": "N/A", "safety_score": None}],
        "news": [{"title": "News", "confidence": object().__repr__(), "relevance": "", "safety_score": "N/A"}],
        "trends": [{"topic": "Trend", "confidence": None, "relevance": object().__repr__(), "safety_score": ""}],
    }
    sample_path = tmp_path / "sample_events.json"
    sample_path.write_text(json.dumps(sample_events), encoding="utf-8")

    config = {
        "sources": {
            "weather": {"enabled": True},
            "news": {"enabled": True},
            "trends": {"enabled": True},
        },
        "ranking": {"weights": {"relevance": 0.45, "freshness": 0.35, "safety": 0.2}},
        "format": {"quiet_mode": False},
        "attribution": {"confidence_disclaimers": {}},
        "insertion_rules": {
            "thresholds": {
                "emergency_min_rank": 0.0,
                "top_of_hour_min_rank": 0.0,
                "mid_break_min_rank": 0.0,
            }
        },
    }

    scheduled = editorial_event_pipeline.run_pipeline(config, str(sample_path))

    assert len(scheduled) == 3
    assert [event["rank_score"] for event in scheduled] == sorted(
        [event["rank_score"] for event in scheduled], reverse=True
    )
    assert all("script_line" in event for event in scheduled)

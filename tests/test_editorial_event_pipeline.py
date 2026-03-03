import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
assert SPEC and SPEC.loader
editorial_event_pipeline = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(editorial_event_pipeline)
run_pipeline = editorial_event_pipeline.run_pipeline


def _config() -> dict:
    return {
        "sources": {
            "weather": {"enabled": True},
            "news": {"enabled": True},
            "trends": {"enabled": True},
        },
        "ranking": {"weights": {"relevance": 0.45, "freshness": 0.35, "safety": 0.2}},
        "format": {"quiet_mode": False},
        "attribution": {
            "confidence_disclaimers": {
                "low": "Low confidence",
                "medium": "Medium confidence",
                "high": "High confidence",
            }
        },
        "insertion_rules": {
            "thresholds": {
                "emergency_min_rank": 0.55,
                "top_of_hour_min_rank": 0.45,
                "mid_break_min_rank": 0.35,
            }
        },
    }


def test_pipeline_handles_malformed_numeric_fields(tmp_path):
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    sample_payload = {
        "weather": [
            {
                "alert": "Storm advisory",
                "timestamp": now_iso,
                "confidence": "",
                "relevance": "N/A",
                "safety_score": None,
                "severity": "normal",
            }
        ],
        "news": [
            {
                "title": "City council update",
                "published_at": now_iso,
                "confidence": None,
                "relevance": object(),
                "safety_score": "N/A",
            }
        ],
        "trends": [
            {
                "topic": "Local festival",
                "timestamp": now_iso,
                "confidence": object(),
                "relevance": "",
                "safety_score": None,
            }
        ],
    }

    sample_path = tmp_path / "events.json"

    sanitized_payload = {
        source: [
            {
                key: (value if isinstance(value, (str, int, float, bool)) or value is None else "[bad-object]")
                for key, value in record.items()
            }
            for record in records
        ]
        for source, records in sample_payload.items()
    }
    sample_path.write_text(json.dumps(sanitized_payload), encoding="utf-8")

    scheduled = run_pipeline(_config(), str(sample_path))

    assert scheduled, "expected ranked output even with malformed numeric fields"
    assert all("rank_score" in event for event in scheduled)
    assert sorted((event["rank_score"] for event in scheduled), reverse=True) == [
        event["rank_score"] for event in scheduled
    ]


def test_defaults_preserved_for_bad_numeric_values(tmp_path):
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    sample_payload = {
        "weather": [{"timestamp": now_iso, "confidence": "N/A", "relevance": "N/A", "safety_score": "N/A"}],
        "news": [{"timestamp": now_iso, "confidence": "N/A", "relevance": "N/A", "safety_score": "N/A"}],
        "trends": [{"timestamp": now_iso, "confidence": "N/A", "relevance": "N/A", "safety_score": "N/A"}],
    }

    sample_path = tmp_path / "events_defaults.json"
    sample_path.write_text(json.dumps(sample_payload), encoding="utf-8")

    scheduled = run_pipeline(_config(), str(sample_path))
    by_source = {event["source"]: event for event in scheduled}

    assert by_source["weather"]["confidence"] == 0.8
    assert by_source["weather"]["relevance_score"] == 0.7
    assert by_source["weather"]["safety_score"] == 0.98

    assert by_source["news"]["confidence"] == 0.75
    assert by_source["news"]["relevance_score"] == 0.6
    assert by_source["news"]["safety_score"] == 0.97

    assert by_source["trends"]["confidence"] == 0.65
    assert by_source["trends"]["relevance_score"] == 0.5
    assert by_source["trends"]["safety_score"] == 0.9


def test_parse_float_handles_object_value():
    assert editorial_event_pipeline.parse_float(object(), 0.42) == 0.42

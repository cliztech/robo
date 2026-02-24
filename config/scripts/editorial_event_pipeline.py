import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class ExternalEvent:
    headline: str
    source: str
    timestamp: str
    confidence: float
    locality: str
    relevance_score: float = 0.5
    safety_score: float = 1.0
    emergency: bool = False


class BaseAdapter:
    source_name = "external"
    default_timeout_seconds = 10.0

    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def fetch(self) -> List[Dict[str, Any]]:
        endpoint = self.config.get("endpoint")
        if not endpoint:
            return []

        timeout_raw = self.config.get("timeout_seconds", self.default_timeout_seconds)
        try:
            timeout = max(0.1, float(timeout_raw))
        except (TypeError, ValueError):
            timeout = self.default_timeout_seconds
        headers = self.config.get("headers", {})
        request_obj = Request(endpoint, headers=headers)
        try:
            request = urlopen(request_obj, timeout=timeout)
            data = request.read().decode("utf-8")
            if not data:
                return []
            payload = json.loads(data)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            self._emit_fetch_diagnostic(endpoint=endpoint, error=exc)
            return []

        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]

        if isinstance(payload, dict):
            items = payload.get("items", [])
            if isinstance(items, list):
                return [item for item in items if isinstance(item, dict)]
            self._emit_fetch_diagnostic(
                endpoint=endpoint,
                error=TypeError(f"payload.items must be list, got {type(items).__name__}"),
            )
            return []

        self._emit_fetch_diagnostic(
            endpoint=endpoint,
            error=TypeError(f"payload must be list or dict, got {type(payload).__name__}"),
        )
        return []

    def _emit_fetch_diagnostic(self, endpoint: str, error: Exception) -> None:
        print(
            json.dumps(
                {
                    "event": "adapter_fetch_failed",
                    "source": self.source_name,
                    "endpoint": endpoint,
                    "error_class": type(error).__name__,
                    "error_message": str(error),
                },
                ensure_ascii=False,
            )
        )

    def normalize(self, records: Iterable[Dict[str, Any]]) -> List[ExternalEvent]:
        raise NotImplementedError


class WeatherAdapter(BaseAdapter):
    source_name = "weather"

    def normalize(self, records: Iterable[Dict[str, Any]]) -> List[ExternalEvent]:
        normalized: List[ExternalEvent] = []
        for item in records:
            severity = str(item.get("severity", "normal")).lower()
            emergency = severity in {"extreme", "severe"}
            safety = 0.8 if emergency else 0.98
            normalized.append(
                ExternalEvent(
                    headline=item.get("headline") or item.get("alert") or "Weather update",
                    source=item.get("source") or self.source_name,
                    timestamp=to_iso8601(item.get("timestamp")),
                    confidence=clamp(
                        parse_float(
                            item.get("confidence", 0.8),
                            0.8,
                            source=self.source_name,
                            field="confidence",
                        )
                    ),
                    locality=item.get("locality") or item.get("region") or "local area",
                    relevance_score=clamp(
                        parse_float(
                            item.get("relevance", 0.7),
                            0.7,
                            source=self.source_name,
                            field="relevance",
                        )
                    ),
                    safety_score=clamp(
                        parse_float(
                            item.get("safety_score", safety),
                            safety,
                            source=self.source_name,
                            field="safety_score",
                        )
                    ),
                    emergency=bool(item.get("emergency", emergency)),
                )
            )
        return normalized


class NewsAdapter(BaseAdapter):
    source_name = "news"

    def normalize(self, records: Iterable[Dict[str, Any]]) -> List[ExternalEvent]:
        normalized: List[ExternalEvent] = []
        for item in records:
            normalized.append(
                ExternalEvent(
                    headline=item.get("title") or item.get("headline") or "News update",
                    source=item.get("source") or self.source_name,
                    timestamp=to_iso8601(item.get("published_at") or item.get("timestamp")),
                    confidence=clamp(
                        parse_float(
                            item.get("confidence", 0.75),
                            0.75,
                            source=self.source_name,
                            field="confidence",
                        )
                    ),
                    locality=item.get("locality") or "national",
                    relevance_score=clamp(
                        parse_float(
                            item.get("relevance", 0.6),
                            0.6,
                            source=self.source_name,
                            field="relevance",
                        )
                    ),
                    safety_score=clamp(
                        parse_float(
                            item.get("safety_score", 0.97),
                            0.97,
                            source=self.source_name,
                            field="safety_score",
                        )
                    ),
                    emergency=bool(item.get("emergency", False)),
                )
            )
        return normalized


class TrendAdapter(BaseAdapter):
    source_name = "trends"

    def normalize(self, records: Iterable[Dict[str, Any]]) -> List[ExternalEvent]:
        normalized: List[ExternalEvent] = []
        for item in records:
            normalized.append(
                ExternalEvent(
                    headline=item.get("topic") or item.get("headline") or "Trending topic",
                    source=item.get("source") or self.source_name,
                    timestamp=to_iso8601(item.get("timestamp")),
                    confidence=clamp(
                        parse_float(
                            item.get("confidence", 0.65),
                            0.65,
                            source=self.source_name,
                            field="confidence",
                        )
                    ),
                    locality=item.get("locality") or "online",
                    relevance_score=clamp(
                        parse_float(
                            item.get("relevance", 0.5),
                            0.5,
                            source=self.source_name,
                            field="relevance",
                        )
                    ),
                    safety_score=clamp(
                        parse_float(
                            item.get("safety_score", 0.9),
                            0.9,
                            source=self.source_name,
                            field="safety_score",
                        )
                    ),
                    emergency=False,
                )
            )
        return normalized


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def parse_float(
    value: Any,
    default: float,
    *,
    source: Optional[str] = None,
    field: Optional[str] = None,
) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        if source and field:
            print(
                f"[editorial_event_pipeline] invalid numeric value for {source}.{field}: {value!r}; using default={default}",
                file=sys.stderr,
            )
        return default


def to_iso8601(value: Optional[str]) -> str:
    if not value:
        return datetime.now(tz=timezone.utc).isoformat()

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.isoformat()
    except ValueError:
        return datetime.now(tz=timezone.utc).isoformat()


def age_in_hours(timestamp: str) -> float:
    parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    now = datetime.now(tz=timezone.utc)
    return max(0.0, (now - parsed).total_seconds() / 3600.0)


def freshness_score(event: ExternalEvent) -> float:
    age = age_in_hours(event.timestamp)
    if age <= 1:
        return 1.0
    if age <= 3:
        return 0.85
    if age <= 8:
        return 0.6
    if age <= 24:
        return 0.4
    return 0.2


def rank_events(events: List[ExternalEvent], weights: Dict[str, float]) -> List[Dict[str, Any]]:
    scored = []
    for event in events:
        relevance = clamp(event.relevance_score)
        freshness = freshness_score(event)
        safety = clamp(event.safety_score)
        rank = (
            weights.get("relevance", 0.45) * relevance
            + weights.get("freshness", 0.35) * freshness
            + weights.get("safety", 0.20) * safety
        ) * clamp(event.confidence)

        scored.append(
            {
                "headline": event.headline,
                "source": event.source,
                "timestamp": event.timestamp,
                "confidence": round(event.confidence, 2),
                "locality": event.locality,
                "relevance_score": round(relevance, 2),
                "freshness_score": round(freshness, 2),
                "safety_score": round(safety, 2),
                "rank_score": round(rank, 4),
                "emergency": event.emergency,
            }
        )

    return sorted(scored, key=lambda item: item["rank_score"], reverse=True)


def insertion_rule(event: Dict[str, Any], quiet_mode: bool, cfg: Dict[str, Any]) -> str:
    thresholds = cfg.get("thresholds", {})
    emergency_score = thresholds.get("emergency_min_rank", 0.55)
    toh_score = thresholds.get("top_of_hour_min_rank", 0.45)
    mid_break_score = thresholds.get("mid_break_min_rank", 0.35)

    if event.get("emergency") and event["rank_score"] >= emergency_score:
        return "emergency_interrupt"

    if quiet_mode:
        if event["rank_score"] >= toh_score and event["safety_score"] >= 0.9:
            return "top_of_hour_bulletin"
        return "quiet_mode_skip"

    if event["rank_score"] >= toh_score:
        return "top_of_hour_bulletin"
    if event["rank_score"] >= mid_break_score:
        return "mid_break_mention"
    return "skip"


def script_line(event: Dict[str, Any], disclaimers: Dict[str, str]) -> str:
    confidence = event["confidence"]
    if confidence < 0.6:
        confidence_note = disclaimers.get("low", "This report is still being verified.")
    elif confidence < 0.8:
        confidence_note = disclaimers.get("medium", "Details may change as sources update.")
    else:
        confidence_note = disclaimers.get("high", "Information is based on currently trusted sources.")

    attribution = f"Source: {event['source']}"
    return f"{event['headline']} ({attribution}). {confidence_note}"


def load_events_from_file(path: str) -> Dict[str, List[Dict[str, Any]]]:
    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    return {
        "weather": payload.get("weather", []),
        "news": payload.get("news", []),
        "trends": payload.get("trends", []),
    }


def run_pipeline(config: Dict[str, Any], sample_events_path: Optional[str]) -> List[Dict[str, Any]]:
    sources = config.get("sources", {})
    adapters = {
        "weather": WeatherAdapter(sources.get("weather", {})),
        "news": NewsAdapter(sources.get("news", {})),
        "trends": TrendAdapter(sources.get("trends", {})),
    }

    if sample_events_path:
        external_data = load_events_from_file(sample_events_path)
    else:
        external_data = {}
        for name, adapter in adapters.items():
            if not sources.get(name, {}).get("enabled", False):
                external_data[name] = []
                continue
            external_data[name] = adapter.fetch()

    normalized: List[ExternalEvent] = []
    for name, records in external_data.items():
        if not sources.get(name, {}).get("enabled", False):
            continue
        normalized.extend(adapters[name].normalize(records))

    ranked = rank_events(normalized, config.get("ranking", {}).get("weights", {}))

    quiet_mode = config.get("format", {}).get("quiet_mode", False)
    disclaimer_policy = config.get("attribution", {}).get("confidence_disclaimers", {})
    insertion_cfg = config.get("insertion_rules", {})

    scheduled = []
    for event in ranked:
        rule = insertion_rule(event, quiet_mode=quiet_mode, cfg=insertion_cfg)
        if rule in {"skip", "quiet_mode_skip"}:
            continue

        scheduled.append(
            {
                **event,
                "insertion_rule": rule,
                "script_line": script_line(event, disclaimer_policy),
            }
        )

    return scheduled


def main() -> None:
    parser = argparse.ArgumentParser(description="External event connector and editorial ranking pipeline")
    parser.add_argument("--config", default="config/editorial_pipeline_config.json", help="Path to pipeline config")
    parser.add_argument(
        "--sample-events",
        default=None,
        help="Path to sample source payloads for local/offline runs",
    )
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        config = json.load(f)

    output = run_pipeline(config, args.sample_events)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()

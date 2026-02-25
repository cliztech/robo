from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Optional

LOGGER = logging.getLogger(__name__)
DEFAULT_EVENT_LOG_PATH = Path("config/logs/scheduler_events.jsonl")


def emit_scheduler_event(
    logger: Optional[logging.Logger] = None,
    *,
    event_name: str,
    level: str,
    message: str,
    metadata: Optional[Mapping[str, Any]] = None,
    correlation_id: Optional[str] = None,
    component: str = "backend.scheduling",
    event_log_path: Path = DEFAULT_EVENT_LOG_PATH,
) -> None:
    """Emit a scheduler structured event using the docs/scheduling_alert_events.md schema."""
    payload: dict[str, Any] = {
        "event_name": event_name,
        "event_version": "v1",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "component": component,
        "message": message,
    }
    if correlation_id:
        payload["correlation_id"] = correlation_id
    if metadata:
        payload["metadata"] = dict(metadata)

    active_logger = logger or LOGGER

    # Also emit to application logger so it is captured by standard logging/caplog
    log_method = getattr(active_logger, level.lower(), active_logger.info)
    log_method(json.dumps(payload))

    try:
        event_log_path.parent.mkdir(parents=True, exist_ok=True)
        with event_log_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
    except OSError:
        active_logger.exception("Failed to write scheduler structured event: %s", event_name)

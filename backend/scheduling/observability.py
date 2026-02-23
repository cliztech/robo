from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional


def emit_scheduler_event(
    logger: logging.Logger,
    *,
    event_name: str,
    level: str,
    message: str,
    metadata: Optional[dict[str, Any]] = None,
    component: str = "backend.scheduling",
    correlation_id: Optional[str] = None,
) -> None:
    """Emit a scheduler structured event using the documented minimal schema."""
    payload: dict[str, Any] = {
        "event_name": event_name,
        "event_version": "v1",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "component": component,
        "message": message,
        "metadata": metadata or {},
    }
    if correlation_id:
        payload["correlation_id"] = correlation_id

    log_fn = getattr(logger, level, logger.info)
    log_fn(json.dumps(payload, sort_keys=True))


import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

class EditorialEventPipeline:
    def __init__(self, source_name: str):
        self.source_name = source_name

    def _safe_float(self, value: Any, default: float = 0.0, source: str = "", field: str = "") -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            if source and field:
                logger.debug(
                    "Invalid numeric value encountered; using default",
                    extra={"source": source, "field": field, "value": value},
                )
            return default

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

def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))

def to_iso8601(value: Optional[str]) -> str:
    # Stub for ISO8601 conversion
    return value or ""

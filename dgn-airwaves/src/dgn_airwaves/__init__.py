"""dgn-airwaves module package."""

__all__ = ["build_segment"]


def build_segment(segment_id: str) -> dict:
    """Return a minimal segment payload matching the shared architecture contract."""
    return {
        "event_type": "airwaves.segment.created",
        "segment_id": segment_id,
        "module": "dgn-airwaves",
    }

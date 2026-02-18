"""dgn-robo-rippa module package."""

__all__ = ["normalize_asset"]


def normalize_asset(asset_id: str) -> dict:
    """Return a minimal normalized-asset payload matching the shared contract."""
    return {
        "event_type": "rippa.asset.normalized",
        "asset_id": asset_id,
        "module": "dgn-robo-rippa",
    }

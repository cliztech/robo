"""Compatibility metadata for legacy track-analysis endpoint.

Canonical endpoint: POST /api/v1/ai/track-analysis
Legacy compatibility endpoint: POST /api/v1/ai/analyze-track
"""

LEGACY_TRACK_ANALYSIS_DEPRECATION = "true"
LEGACY_TRACK_ANALYSIS_WARNING = (
    '299 - "Deprecated endpoint: use /api/v1/ai/track-analysis; '
    '/api/v1/ai/analyze-track will be removed in a future release."'
)

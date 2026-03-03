"""Add composite indexes for high-frequency query patterns.

Revision ID: 002
Revises: 001
Create Date: 2026-02-25

Indexes target the most common query patterns identified from backend code:
- Track lookups by genre + mood (playlist generation)
- Schedule queries by station + date range (scheduler UI)
- Playlist item ordering (playlist playback)
- Audit log filtering by event type + timestamp (ops dashboard)
- Prompt template lookup by name + active status (prompt engine)
"""
from __future__ import annotations

from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create composite indexes for query optimization."""

    # Tracks — genre + mood (AI playlist generation queries)
    op.create_index(
        "ix_tracks_genre_mood",
        "tracks",
        ["genre", "mood"],
    )

    # Tracks — artist lookup (search and dedup)
    op.create_index(
        "ix_tracks_artist",
        "tracks",
        ["artist"],
    )

    # Tracks — file hash (duplicate detection)
    op.create_index(
        "ix_tracks_file_hash",
        "tracks",
        ["file_hash"],
        unique=True,
    )

    # Schedule blocks — station + start_time range (scheduler UI timeline)
    op.create_index(
        "ix_schedule_blocks_station_time",
        "schedule_blocks",
        ["station_id", "start_time", "end_time"],
    )

    # Schedule blocks — block_type (filtering by segment type)
    op.create_index(
        "ix_schedule_blocks_type",
        "schedule_blocks",
        ["block_type"],
    )

    # Playlist items — ordering within playlist
    op.create_index(
        "ix_playlist_items_playlist_position",
        "playlist_items",
        ["playlist_id", "position"],
    )

    # Audit log — event type + timestamp (ops queries)
    op.create_index(
        "ix_audit_log_event_type_created",
        "audit_log",
        ["event_type", "created_at"],
    )

    # Prompt templates — name + active (template lookup)
    op.create_index(
        "ix_prompt_templates_name_active",
        "prompt_templates",
        ["name", "is_active"],
    )


def downgrade() -> None:
    """Drop all indexes added in this migration."""
    op.drop_index("ix_prompt_templates_name_active", table_name="prompt_templates")
    op.drop_index("ix_audit_log_event_type_created", table_name="audit_log")
    op.drop_index("ix_playlist_items_playlist_position", table_name="playlist_items")
    op.drop_index("ix_schedule_blocks_type", table_name="schedule_blocks")
    op.drop_index("ix_schedule_blocks_station_time", table_name="schedule_blocks")
    op.drop_index("ix_tracks_file_hash", table_name="tracks")
    op.drop_index("ix_tracks_artist", table_name="tracks")
    op.drop_index("ix_tracks_genre_mood", table_name="tracks")

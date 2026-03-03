"""Initial schema baseline.

Revision ID: 001
Revises: None
Create Date: 2026-02-25

Captures the baseline schema for DGN-DJ / RoboDJ.
This migration creates the foundational tables used by the backend services.
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision: str = "001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create baseline tables."""

    # --- Tracks ---
    op.create_table(
        "tracks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("artist", sa.String(512), nullable=True),
        sa.Column("album", sa.String(512), nullable=True),
        sa.Column("genre", sa.String(128), nullable=True),
        sa.Column("bpm", sa.Float, nullable=True),
        sa.Column("key", sa.String(8), nullable=True),
        sa.Column("mood", sa.String(64), nullable=True),
        sa.Column("energy", sa.Float, nullable=True),
        sa.Column("duration_seconds", sa.Float, nullable=True),
        sa.Column("file_path", sa.String(1024), nullable=False),
        sa.Column("file_hash", sa.String(128), nullable=True),
        sa.Column("analysis_version", sa.Integer, nullable=True, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # --- Playlists ---
    op.create_table(
        "playlists",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_dynamic", sa.Boolean, server_default="0"),
        sa.Column("rule_definition", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # --- Playlist Items (join table) ---
    op.create_table(
        "playlist_items",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("playlist_id", sa.Integer, sa.ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("track_id", sa.Integer, sa.ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("position", sa.Integer, nullable=False),
        sa.Column("added_at", sa.DateTime, server_default=sa.func.now()),
    )

    # --- Schedule Blocks ---
    op.create_table(
        "schedule_blocks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("station_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("start_time", sa.DateTime, nullable=False),
        sa.Column("end_time", sa.DateTime, nullable=False),
        sa.Column("block_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(256), nullable=True),
        sa.Column("template_ref", sa.String(128), nullable=True),
        sa.Column("metadata_json", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # --- Prompt Templates ---
    op.create_table(
        "prompt_templates",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(256), nullable=False, unique=True),
        sa.Column("template_body", sa.Text, nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # --- Audit Log ---
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("entity_type", sa.String(128), nullable=True),
        sa.Column("entity_id", sa.String(128), nullable=True),
        sa.Column("actor", sa.String(256), nullable=True),
        sa.Column("details_json", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    """Drop all baseline tables in reverse order."""
    op.drop_table("audit_log")
    op.drop_table("prompt_templates")
    op.drop_table("schedule_blocks")
    op.drop_table("playlist_items")
    op.drop_table("playlists")
    op.drop_table("tracks")

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol, Sequence

from backend.status.models import AlertCenterItem, AlertSeverity


class StatusAlertRepository(Protocol):
    def list_alerts(self, severity: AlertSeverity | None = None) -> list[AlertCenterItem]:
        ...

    def acknowledge_alert(self, alert_id: str) -> AlertCenterItem | None:
        ...

    def reconcile_alerts(self, alerts: Sequence[AlertCenterItem], observed_at: datetime) -> None:
        ...


class SQLiteStatusAlertRepository:
    def __init__(self, db_path: Path, default_alerts: Sequence[AlertCenterItem]) -> None:
        self._db_path = db_path
        self._default_alerts = default_alerts
        self._initialize()

    def list_alerts(self, severity: AlertSeverity | None = None) -> list[AlertCenterItem]:
        query = "SELECT * FROM status_alerts WHERE resolved_at IS NULL"
        params: list[str] = []
        if severity is not None:
            query += " AND severity = ?"
            params.append(severity.value)
        query += " ORDER BY created_at DESC"

        with self._connect() as connection:
            rows = connection.execute(query, tuple(params)).fetchall()
        return [self._row_to_alert(row) for row in rows]

    def acknowledge_alert(self, alert_id: str) -> AlertCenterItem | None:
        acknowledged_at = datetime.now(timezone.utc).isoformat()
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE status_alerts
                SET acknowledged = 1,
                    acknowledged_at = COALESCE(acknowledged_at, ?)
                WHERE alert_id = ? AND resolved_at IS NULL
                """,
                (acknowledged_at, alert_id),
            )
            if cursor.rowcount == 0:
                return None

            row = connection.execute(
                "SELECT * FROM status_alerts WHERE alert_id = ?",
                (alert_id,),
            ).fetchone()

        if row is None:
            return None
        return self._row_to_alert(row)

    def reconcile_alerts(self, alerts: Sequence[AlertCenterItem], observed_at: datetime) -> None:
        if observed_at.tzinfo is None:
            observed_at = observed_at.replace(tzinfo=timezone.utc)
        observed_at_iso = observed_at.isoformat()
        active_alert_ids = {alert.alert_id for alert in alerts}

        with self._connect() as connection:
            for alert in alerts:
                connection.execute(
                    """
                    INSERT INTO status_alerts (
                        alert_id, severity, title, description, created_at,
                        acknowledged, acknowledged_at, last_seen_at, resolved_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
                    ON CONFLICT(alert_id) DO UPDATE SET
                        severity = excluded.severity,
                        title = excluded.title,
                        description = excluded.description,
                        last_seen_at = excluded.last_seen_at,
                        resolved_at = NULL
                    """,
                    (
                        alert.alert_id,
                        alert.severity.value,
                        alert.title,
                        alert.description,
                        alert.created_at.isoformat(),
                        int(alert.acknowledged),
                        alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                        observed_at_iso,
                    ),
                )

            if active_alert_ids:
                placeholders = ",".join("?" for _ in active_alert_ids)
                connection.execute(
                    f"""
                    UPDATE status_alerts
                    SET resolved_at = ?
                    WHERE resolved_at IS NULL
                      AND alert_id NOT IN ({placeholders})
                    """,
                    (observed_at_iso, *sorted(active_alert_ids)),
                )
            else:
                connection.execute(
                    """
                    UPDATE status_alerts
                    SET resolved_at = ?
                    WHERE resolved_at IS NULL
                    """,
                    (observed_at_iso,),
                )

    def _initialize(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS status_alerts (
                    alert_id TEXT PRIMARY KEY,
                    severity TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    acknowledged INTEGER NOT NULL DEFAULT 0,
                    acknowledged_at TEXT,
                    last_seen_at TEXT,
                    resolved_at TEXT
                )
                """
            )
            columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(status_alerts)").fetchall()
            }
            if "last_seen_at" not in columns:
                connection.execute("ALTER TABLE status_alerts ADD COLUMN last_seen_at TEXT")
            if "resolved_at" not in columns:
                connection.execute("ALTER TABLE status_alerts ADD COLUMN resolved_at TEXT")

            for alert in self._default_alerts:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO status_alerts (
                        alert_id, severity, title, description, created_at, acknowledged,
                        acknowledged_at, last_seen_at, resolved_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
                    """,
                    (
                        alert.alert_id,
                        alert.severity.value,
                        alert.title,
                        alert.description,
                        alert.created_at.isoformat(),
                        int(alert.acknowledged),
                        alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                        alert.created_at.isoformat(),
                    ),
                )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _row_to_alert(row: sqlite3.Row) -> AlertCenterItem:
        acknowledged_at = row["acknowledged_at"]
        return AlertCenterItem(
            alert_id=row["alert_id"],
            severity=AlertSeverity(row["severity"]),
            title=row["title"],
            description=row["description"],
            created_at=datetime.fromisoformat(row["created_at"]),
            acknowledged=bool(row["acknowledged"]),
            acknowledged_at=datetime.fromisoformat(acknowledged_at) if acknowledged_at else None,
        )

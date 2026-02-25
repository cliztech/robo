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


class SQLiteStatusAlertRepository:
    def __init__(self, db_path: Path, default_alerts: Sequence[AlertCenterItem]) -> None:
        self._db_path = db_path
        self._default_alerts = default_alerts
        self._initialize()

    def list_alerts(self, severity: AlertSeverity | None = None) -> list[AlertCenterItem]:
        query = "SELECT * FROM status_alerts"
        params: tuple[str, ...] = ()
        if severity is not None:
            query += " WHERE severity = ?"
            params = (severity.value,)
        query += " ORDER BY created_at DESC"

        with self._connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [self._row_to_alert(row) for row in rows]

    def acknowledge_alert(self, alert_id: str) -> AlertCenterItem | None:
        acknowledged_at = datetime.now(timezone.utc).isoformat()
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE status_alerts
                SET acknowledged = 1,
                    acknowledged_at = COALESCE(acknowledged_at, ?)
                WHERE alert_id = ?
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
                    acknowledged_at TEXT
                )
                """
            )
            for alert in self._default_alerts:
                connection.execute(
                    """
                    INSERT OR IGNORE INTO status_alerts (
                        alert_id, severity, title, description, created_at, acknowledged, acknowledged_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        alert.alert_id,
                        alert.severity.value,
                        alert.title,
                        alert.description,
                        alert.created_at.isoformat(),
                        int(alert.acknowledged),
                        alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
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

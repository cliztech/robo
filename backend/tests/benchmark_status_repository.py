import time
from datetime import datetime, timezone
import tempfile
from pathlib import Path
import sqlite3
import random

from backend.status.repository import SQLiteStatusAlertRepository
from backend.status.models import AlertCenterItem, AlertSeverity

def generate_alerts(count):
    alerts = []
    for i in range(count):
        alerts.append(
            AlertCenterItem(
                alert_id=f"alert_{i}",
                severity=AlertSeverity.info,
                title=f"Alert {i}",
                description=f"Description {i}",
                created_at=datetime.now(timezone.utc),
                acknowledged=False,
                acknowledged_at=None,
            )
        )
    return alerts

def run_benchmark():
    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = Path(temp_dir) / "status.db"
        repo = SQLiteStatusAlertRepository(db_path, [])

        # Test with 10,000 alerts to exaggerate N+1 issues
        alerts = generate_alerts(10000)
        observed_at = datetime.now(timezone.utc)

        # Insert them once
        start = time.perf_counter()
        repo.reconcile_alerts(alerts, observed_at)
        end = time.perf_counter()
        print(f"Time taken to insert {len(alerts)} alerts: {end - start:.4f} seconds")

        # Reconcile again (update)
        start = time.perf_counter()
        repo.reconcile_alerts(alerts, observed_at)
        end = time.perf_counter()
        print(f"Time taken to update {len(alerts)} alerts: {end - start:.4f} seconds")

if __name__ == "__main__":
    run_benchmark()

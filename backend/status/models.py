from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class AlertSeverity(str, Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


class AlertCenterItem(BaseModel):
    alert_id: str
    severity: AlertSeverity
    title: str
    description: str
    created_at: datetime
    acknowledged: bool = False
    acknowledged_at: datetime | None = None

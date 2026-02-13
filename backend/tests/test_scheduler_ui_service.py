from __future__ import annotations

import pytest

from backend.scheduling.scheduler_models import (
    ContentRef,
    ScheduleRecord,
    ScheduleSpec,
    ScheduleWindow,
    TemplateType,
    UiState,
)
from backend.scheduling.scheduler_ui_service import SchedulerUiService


def _base_schedule(schedule_id: str, name: str, cron: str = "0 9 * * 1") -> ScheduleRecord:
    return ScheduleRecord(
        id=schedule_id,
        name=name,
        enabled=True,
        timezone="UTC",
        ui_state=UiState.active,
        priority=50,
        start_window=ScheduleWindow(value="2026-01-01T00:00:00Z"),
        end_window=ScheduleWindow(value="2026-12-31T23:59:59Z"),
        content_refs=[ContentRef(type="script", ref_id=f"script:{schedule_id}")],
        schedule_spec=ScheduleSpec(mode="cron", cron=cron),
    )


def test_template_primitives_cover_expected_days():
    service = SchedulerUiService()

    primitives = service.template_primitives()

    assert len(primitives[TemplateType.weekday].blocks) == 5
    assert len(primitives[TemplateType.weekend].blocks) == 2
    assert len(primitives[TemplateType.overnight].blocks) == 7


def test_validate_schedules_reports_duplicate_name_deterministically():
    service = SchedulerUiService()
    schedules = [
        _base_schedule("sch_alpha", "Morning Show"),
        _base_schedule("sch_beta", "morning show"),
    ]

    conflicts = service.validate_schedules(schedules)

    assert [c.conflict_type.value for c in conflicts] == ["duplicate_name", "ambiguous_active"]


def test_update_schedules_blocks_publish_on_conflict(tmp_path):
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    schedules = [
        _base_schedule("sch_a", "Block A", cron="0 9 * * 1"),
        _base_schedule("sch_b", "Block B", cron="0 9 * * 1"),
    ]

    with pytest.raises(ValueError, match="Cannot save schedules while conflicts exist"):
        service.update_schedules(schedules)

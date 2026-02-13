from __future__ import annotations

import pytest

from backend.scheduling.scheduler_models import (
    ContentRef,
    ScheduleRecord,
    ScheduleSpec,
    ScheduleWindow,
    TemplateApplyRequest,
    TemplateType,
    UiState,
)
from backend.scheduling.scheduler_ui_service import SchedulerUiService

BASE_CONTENT = [ContentRef(type="script", ref_id="script:top_hour", weight=100)]


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
        content_refs=BASE_CONTENT,
        schedule_spec=ScheduleSpec(mode="cron", cron=cron),
    )


def _standalone_schedule(schedule_id: str, name: str, day_code: str, hour: int, duration: int) -> ScheduleRecord:
    return ScheduleRecord(
        id=schedule_id,
        name=name,
        enabled=True,
        timezone="UTC",
        ui_state=UiState.active,
        priority=50,
        start_window=ScheduleWindow(value="2026-01-01T00:00:00Z"),
        end_window=ScheduleWindow(value="2026-12-31T23:59:59Z"),
        content_refs=BASE_CONTENT,
        schedule_spec=ScheduleSpec(
            mode="rrule",
            rrule=(
                f"FREQ=WEEKLY;INTERVAL=1;BYDAY={day_code};"
                f"BYHOUR={hour};BYMINUTE=0;BYSECOND=0;DURATION_MINUTES={duration}"
            ),
        ),
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

    types = [item.conflict_type.value for item in conflicts]
    assert "duplicate_name" in types


def test_detect_conflict_messages_are_actionable():
    service = SchedulerUiService()
    schedules = [
        _standalone_schedule("sch_a", "Morning A", "MO", 9, 120),
        _standalone_schedule("sch_b", "Morning B", "MO", 10, 120),
    ]

    conflicts = service.validate_schedules(schedules)

    assert any(c.conflict_type.value == "overlap" for c in conflicts)
    overlap = next(c for c in conflicts if c.conflict_type.value == "overlap")
    assert overlap.suggestions


def test_update_schedules_blocks_save_when_conflicts_exist(tmp_path):
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    schedules = [
        _standalone_schedule("sch_a", "Morning A", "MO", 9, 120),
        _standalone_schedule("sch_b", "Morning B", "MO", 10, 120),
    ]

    with pytest.raises(ValueError, match="Cannot save schedules while conflicts exist"):
        service.update_schedules(schedules)


def test_publish_schedules_passes_for_template_primitive(tmp_path):
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    template_schedules = service.apply_template(
        TemplateApplyRequest(template="weekday", timezone="UTC", content_refs=BASE_CONTENT)
    )

    result = service.publish_schedules(template_schedules)

    assert result["status"] == "published"
    assert result["schedule_count"] == 5

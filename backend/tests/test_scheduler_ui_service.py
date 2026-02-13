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
import pytest

from backend.scheduling.scheduler_models import ScheduleRecord, TemplateApplyRequest
from backend.scheduling.scheduler_ui_service import SchedulerUiService


BASE_CONTENT = [{"type": "script", "ref_id": "script:top_hour", "weight": 100}]


def _standalone_schedule(schedule_id: str, name: str, day: str, start: str, duration: int = 60) -> ScheduleRecord:
    day_map = {
        "monday": "MO",
        "tuesday": "TU",
        "wednesday": "WE",
        "thursday": "TH",
        "friday": "FR",
        "saturday": "SA",
        "sunday": "SU",
    }
    return ScheduleRecord.model_validate(
        {
            "id": schedule_id,
            "name": name,
            "enabled": True,
            "timezone": "UTC",
            "ui_state": "active",
            "priority": 50,
            "start_window": {"type": "datetime", "value": "2026-01-01T00:00:00Z"},
            "end_window": {"type": "datetime", "value": "2026-12-31T23:59:59Z"},
            "content_refs": BASE_CONTENT,
            "schedule_spec": {
                "mode": "rrule",
                "rrule": (
                    f"FREQ=WEEKLY;INTERVAL=1;BYDAY={day_map[day]};"
                    f"BYHOUR={int(start.split(':')[0])};BYMINUTE={int(start.split(':')[1])};"
                    f"BYSECOND=0;DURATION_MINUTES={duration}"
                ),
            },
        }
    )


def test_detect_conflict_messages_are_actionable():
    service = SchedulerUiService()
    schedules = [
        _standalone_schedule("sch_a", "Morning A", "monday", "09:00", duration=120),
        _standalone_schedule("sch_b", "Morning B", "monday", "10:00", duration=120),
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
    assert conflicts
    assert any(conflict.conflict_type.value == "overlap" for conflict in conflicts)
    overlap = next(conflict for conflict in conflicts if conflict.conflict_type.value == "overlap")
    assert overlap.suggestions
    assert any("Move one block" in suggestion.message for suggestion in overlap.suggestions)


def test_update_schedules_blocks_save_when_conflicts_exist(tmp_path):
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    schedules = [
        _standalone_schedule("sch_a", "Morning A", "monday", "09:00", duration=120),
        _standalone_schedule("sch_b", "Morning B", "monday", "10:00", duration=120),
    ]

    with pytest.raises(ValueError, match="Cannot save/publish schedules"):
        service.update_schedules(schedules)


def test_publish_schedules_passes_for_template_primitive(tmp_path):
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    template_schedules = service.apply_template(
        TemplateApplyRequest(template="weekday", timezone="UTC", content_refs=BASE_CONTENT)
    )

    result = service.publish_schedules(template_schedules)

    assert result["status"] == "published"
    assert result["schedule_count"] == 5

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


def _schedule(
    schedule_id: str,
    name: str,
    cron: str = "0 9 * * 1",
    *,
    priority: int = 50,
) -> ScheduleRecord:
    return ScheduleRecord(
        id=schedule_id,
        name=name,
        enabled=True,
        timezone="UTC",
        ui_state=UiState.active,
        priority=priority,
        start_window=ScheduleWindow(value="2026-01-01T00:00:00Z"),
        end_window=ScheduleWindow(value="2026-12-31T23:59:59Z"),
        content_refs=[ContentRef(type="script", ref_id=f"script:{schedule_id}")],
        schedule_spec=ScheduleSpec(mode="cron", cron=cron),
    )


def test_template_primitives_cover_expected_days() -> None:
    service = SchedulerUiService()

    primitives = service.template_primitives()

    assert len(primitives[TemplateType.weekday].blocks) == 5
    assert len(primitives[TemplateType.weekend].blocks) == 2
    assert len(primitives[TemplateType.overnight].blocks) == 7


def test_conflicts_are_deterministic_and_actionable() -> None:
    service = SchedulerUiService()
    schedules = [
        _schedule("sch_a", "Morning Show", cron="0 9 * * 1", priority=50),
        _schedule("sch_b", "morning show", cron="0 9 * * 1", priority=50),
    ]

    conflicts = service.validate_schedules(schedules)

    assert [item.conflict_type.value for item in conflicts] == [
        "ambiguous_dispatch",
        "duplicate_name",
        "overlap",
    ]
    assert all(item.suggestions for item in conflicts)


def test_update_schedules_blocks_save_when_conflicts_exist(tmp_path) -> None:
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")

    with pytest.raises(ValueError, match="Cannot save/publish schedules"):
        service.update_schedules(
            [
                _schedule("sch_a", "Block A", cron="0 9 * * 1"),
                _schedule("sch_b", "Block B", cron="0 9 * * 1"),
            ]
        )


def test_update_schedules_validates_schema_before_write(tmp_path) -> None:
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")

    bad = _schedule("sch_schema", "Schema Fail")
    bad.id = ""

    with pytest.raises(ValueError):
        service.update_schedules([bad])


def test_publish_schedules_passes_for_template_primitive(tmp_path) -> None:
    service = SchedulerUiService(schedules_path=tmp_path / "schedules.json")
    template_schedules = service.apply_template(
        TemplateApplyRequest(
            template=TemplateType.weekday,
            timezone="UTC",
            content_refs=[ContentRef(type="script", ref_id="script:top_hour", weight=100)],
        )
    )

    result = service.publish_schedules(template_schedules)

    assert result["status"] == "published"
    assert result["schedule_count"] == 5

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
        content_refs=BASE_CONTENT,
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




def test_build_timeline_blocks_supports_numeric_cron() -> None:
    service = SchedulerUiService()

    blocks = service._build_timeline_blocks([_schedule("sch_numeric", "Numeric Cron", cron="0 9 * * 1")])

    assert len(blocks) == 1
    assert blocks[0].schedule_id == "sch_numeric"
    assert blocks[0].start_time == "09:00"


def test_build_timeline_blocks_skips_wildcard_cron_without_crashing(caplog: pytest.LogCaptureFixture) -> None:
    service = SchedulerUiService()

    with caplog.at_level("WARNING"):
        blocks = service._build_timeline_blocks([_schedule("sch_wild", "Wildcard Cron", cron="* * * * *")])

    assert blocks == []
    assert "Skipping timeline block for schedule_id=sch_wild" in caplog.text


def test_build_timeline_blocks_skips_step_cron_without_crashing(caplog: pytest.LogCaptureFixture) -> None:
    service = SchedulerUiService()

    with caplog.at_level("WARNING"):
        blocks = service._build_timeline_blocks([_schedule("sch_step", "Step Cron", cron="*/15 * * * *")])

    assert blocks == []
    assert "Skipping timeline block for schedule_id=sch_step" in caplog.text

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

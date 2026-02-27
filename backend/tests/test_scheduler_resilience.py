import pytest
import logging
from backend.scheduling.scheduler_ui_service import SchedulerUiService
from backend.scheduling.scheduler_models import ScheduleRecord, ScheduleSpec, UiState, ScheduleWindow, ContentRef

def test_rrule_malformed_graceful_handling(tmp_path, caplog):
    # This test demonstrates the fix.
    # Behavior: Logs warning and skips block.

    schedules_path = tmp_path / "schedules.json"
    service = SchedulerUiService(schedules_path=schedules_path)

    # Create a schedule with a malformed RRULE (non-integer BYHOUR)
    record = ScheduleRecord(
        id="sch_crash",
        name="Crash Test",
        enabled=True,
        timezone="UTC",
        ui_state=UiState.active,
        priority=50,
        start_window=ScheduleWindow(value="2026-01-01T00:00:00Z"),
        end_window=ScheduleWindow(value="2026-12-31T23:59:59Z"),
        content_refs=[ContentRef(type="script", ref_id="script:top_hour", weight=100)],
        schedule_spec=ScheduleSpec(
            mode="rrule",
            rrule="FREQ=WEEKLY;BYDAY=MO;BYHOUR=invalid;BYMINUTE=0"
        ),
    )

    with caplog.at_level(logging.WARNING):
        blocks = service._build_timeline_blocks([record])

    # Assert that no exception was raised (implicit)

    # Assert that the block was skipped
    assert len(blocks) == 0

    # Assert that a warning was logged
    assert "Skipping timeline block for schedule_id=sch_crash" in caplog.text
    assert "invalid rrule format" in caplog.text

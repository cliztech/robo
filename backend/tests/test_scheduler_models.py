from __future__ import annotations

import pytest
from pydantic import ValidationError

from backend.scheduling.scheduler_models import (
    ContentRef,
    ScheduleRecord,
    ScheduleSpec,
    ScheduleWindow,
    ScheduleOverrides,
    TemplateRef,
    UiState,
)

def _create_base_schedule_kwargs(
    schedule_id: str = "test_schedule",
    name: str = "Test Schedule",
    enabled: bool = True,
) -> dict:
    return {
        "id": schedule_id,
        "name": name,
        "enabled": enabled,
        "timezone": "UTC",
        "ui_state": UiState.active,
        "priority": 50,
        "start_window": ScheduleWindow(value="2024-01-01T00:00:00Z"),
        "end_window": ScheduleWindow(value="2024-12-31T23:59:59Z"),
        "content_refs": [ContentRef(type="script", ref_id="test_script", weight=100)],
        "schedule_spec": ScheduleSpec(mode="cron", cron="0 9 * * 1"),
    }

def test_valid_standalone_schedule():
    kwargs = _create_base_schedule_kwargs()
    record = ScheduleRecord(**kwargs)
    assert record.id == "test_schedule"
    assert record.template_ref is None
    assert record.overrides is None

def test_valid_template_schedule():
    record = ScheduleRecord(
        id="template_based",
        name="Template Based",
        enabled=True,
        template_ref=TemplateRef(id="base_template", version=1),
        overrides=ScheduleOverrides(
            timezone="America/New_York",
            priority=80
        )
    )
    assert record.template_ref.id == "base_template"
    assert record.overrides.timezone == "America/New_York"
    assert record.overrides.priority == 80

def test_overrides_without_template_ref_raises_error():
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="invalid",
            name="Invalid",
            enabled=True,
            overrides=ScheduleOverrides(priority=10)
        )
    # Pydantic wraps the error, so we check string representation
    assert "overrides cannot exist without template_ref" in str(excinfo.value)

def test_duplicate_keys_in_overrides_raises_error():
    # Attempt to define priority in both top-level (via template inheritance or explicit field)
    # and overrides is tricky because ScheduleRecord fields are optional.
    # The validation logic checks if self.field is not None AND self.overrides.field is not None.

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="duplicate",
            name="Duplicate",
            enabled=True,
            template_ref=TemplateRef(id="tpl", version=1),
            priority=50,  # Top-level set
            overrides=ScheduleOverrides(priority=60)  # Override set
        )
    assert "ambiguous configuration: priority appears in both top-level and overrides" in str(excinfo.value)

def test_standalone_schedule_missing_required_fields():
    # Create a schedule that is standalone (no template_ref) but missing required fields
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="incomplete",
            name="Incomplete",
            enabled=True
            # Missing timezone, ui_state, priority, etc.
        )
    assert "standalone schedule requires:" in str(excinfo.value)

def test_start_window_after_end_window_raises_error():
    kwargs = _create_base_schedule_kwargs()
    kwargs["start_window"] = ScheduleWindow(value="2025-01-01T00:00:00Z")
    kwargs["end_window"] = ScheduleWindow(value="2024-01-01T00:00:00Z")

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs)
    assert "start_window.value must be <= end_window.value" in str(excinfo.value)

def test_invalid_timezone_raises_error():
    kwargs = _create_base_schedule_kwargs()
    kwargs["timezone"] = "Invalid/Timezone"

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs)
    assert "Unknown IANA timezone: Invalid/Timezone" in str(excinfo.value)

def test_priority_range_validation():
    kwargs = _create_base_schedule_kwargs()

    # Test > 100
    kwargs_high = kwargs.copy()
    kwargs_high["priority"] = 101
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs_high)
    assert "Input should be less than or equal to 100" in str(excinfo.value)

    # Test < 0
    kwargs_low = kwargs.copy()
    kwargs_low["priority"] = -1
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs_low)
    assert "Input should be greater than or equal to 0" in str(excinfo.value)

def test_duplicate_override_keys_helper():
    # Test valid case (no duplicates)
    record = ScheduleRecord(
        id="test",
        name="Test",
        enabled=True,
        template_ref=TemplateRef(id="tpl", version=1),
        priority=None,
        overrides=ScheduleOverrides(priority=10)
    )
    assert record.duplicate_override_keys() == set()

    # Test standalone (no overrides)
    kwargs = _create_base_schedule_kwargs()
    standalone = ScheduleRecord(**kwargs)
    assert standalone.duplicate_override_keys() == set()


def test_schedule_spec_allows_wildcard_and_step_cron_fields():
    wildcard = ScheduleSpec(mode="cron", cron="* * * * *")
    step = ScheduleSpec(mode="cron", cron="*/15 * * * *")

    assert wildcard.cron == "* * * * *"
    assert step.cron == "*/15 * * * *"


def test_schedule_spec_rejects_invalid_cron_time_token():
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="cron", cron="foo 9 * * 1")

    assert "cron minute/hour fields must be numeric, wildcard, range, or step expressions" in str(excinfo.value)

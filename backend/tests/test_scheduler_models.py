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

def test_schedule_spec_one_off_validation():
    # Valid one_off
    spec = ScheduleSpec(mode="one_off", run_at="2024-01-01T00:00:00Z")
    assert spec.mode == "one_off"
    assert spec.run_at == "2024-01-01T00:00:00Z"

    # Missing run_at
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="one_off")
    assert "mode=one_off requires run_at" in str(excinfo.value)

    # With rrule (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="one_off", run_at="2024-01-01T00:00:00Z", rrule="FREQ=DAILY")
    assert "mode=one_off only allows run_at" in str(excinfo.value)

    # With cron (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="one_off", run_at="2024-01-01T00:00:00Z", cron="* * * * *")
    assert "mode=one_off only allows run_at" in str(excinfo.value)


def test_schedule_spec_rrule_validation():
    # Valid rrule
    spec = ScheduleSpec(mode="rrule", rrule="FREQ=DAILY;COUNT=5")
    assert spec.mode == "rrule"
    assert "FREQ=DAILY" in spec.rrule

    # Missing rrule
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="rrule")
    assert "mode=rrule requires rrule containing FREQ=" in str(excinfo.value)

    # Invalid rrule format (missing FREQ=)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="rrule", rrule="INVALID_RRULE")
    assert "mode=rrule requires rrule containing FREQ=" in str(excinfo.value)

    # With run_at (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="rrule", rrule="FREQ=DAILY", run_at="2024-01-01T00:00:00Z")
    assert "mode=rrule only allows rrule" in str(excinfo.value)

    # With cron (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="rrule", rrule="FREQ=DAILY", cron="* * * * *")
    assert "mode=rrule only allows rrule" in str(excinfo.value)


def test_schedule_spec_cron_validation():
    # Valid cron
    spec = ScheduleSpec(mode="cron", cron="0 9 * * 1")
    assert spec.mode == "cron"
    assert spec.cron == "0 9 * * 1"

    # Missing cron
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="cron")
    assert "mode=cron requires cron" in str(excinfo.value)

    # With run_at (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="cron", cron="0 9 * * 1", run_at="2024-01-01T00:00:00Z")
    assert "mode=cron only allows cron" in str(excinfo.value)

    # With rrule (invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="cron", cron="0 9 * * 1", rrule="FREQ=DAILY")
    assert "mode=cron only allows cron" in str(excinfo.value)

    # Invalid cron length
    with pytest.raises(ValidationError) as excinfo:
        ScheduleSpec(mode="cron", cron="* * * *")  # 4 fields
    assert "cron must use five fields" in str(excinfo.value)

def test_schedule_record_effective_window_validation():
    # Base: start_window, Overrides: end_window
    # Case 1: start <= end (Valid)
    record = ScheduleRecord(
        id="mixed_windows_valid",
        name="Mixed Windows Valid",
        enabled=True,
        template_ref=TemplateRef(id="tpl", version=1),
        start_window=ScheduleWindow(value="2024-01-01T00:00:00Z"),
        overrides=ScheduleOverrides(
            end_window=ScheduleWindow(value="2024-01-02T00:00:00Z")
        )
    )
    assert record.effective_start_window().value == "2024-01-01T00:00:00Z"
    assert record.effective_end_window().value == "2024-01-02T00:00:00Z"

    # Case 2: start > end (Invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="mixed_windows_invalid",
            name="Mixed Windows Invalid",
            enabled=True,
            template_ref=TemplateRef(id="tpl", version=1),
            start_window=ScheduleWindow(value="2024-01-02T00:00:00Z"),
            overrides=ScheduleOverrides(
                end_window=ScheduleWindow(value="2024-01-01T00:00:00Z")
            )
        )
    assert "start_window.value must be <= end_window.value" in str(excinfo.value)


def test_schedule_record_effective_window_validation_reverse():
    # Base: end_window, Overrides: start_window
    # Case 1: start <= end (Valid)
    record = ScheduleRecord(
        id="mixed_windows_reverse_valid",
        name="Mixed Windows Reverse Valid",
        enabled=True,
        template_ref=TemplateRef(id="tpl", version=1),
        end_window=ScheduleWindow(value="2024-01-02T00:00:00Z"),
        overrides=ScheduleOverrides(
            start_window=ScheduleWindow(value="2024-01-01T00:00:00Z")
        )
    )
    assert record.effective_start_window().value == "2024-01-01T00:00:00Z"
    assert record.effective_end_window().value == "2024-01-02T00:00:00Z"

    # Case 2: start > end (Invalid)
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="mixed_windows_reverse_invalid",
            name="Mixed Windows Reverse Invalid",
            enabled=True,
            template_ref=TemplateRef(id="tpl", version=1),
            end_window=ScheduleWindow(value="2024-01-01T00:00:00Z"),
            overrides=ScheduleOverrides(
                start_window=ScheduleWindow(value="2024-01-02T00:00:00Z")
            )
        )
    assert "start_window.value must be <= end_window.value" in str(excinfo.value)

def test_schedule_record_multiple_duplicate_keys():
    # Test with multiple duplicate keys to ensure all are reported
    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(
            id="multi_duplicate",
            name="Multi Duplicate",
            enabled=True,
            template_ref=TemplateRef(id="tpl", version=1),
            priority=50,
            timezone="UTC",
            overrides=ScheduleOverrides(
                priority=60,
                timezone="America/New_York"
            )
        )
    # The error message should list the duplicate keys
    assert "ambiguous configuration: priority, timezone appears in both top-level and overrides" in str(excinfo.value)


def test_template_ref_without_overrides_is_valid():
    # Verify that a ScheduleRecord with a template_ref but no overrides is valid
    record = ScheduleRecord(
        id="template_no_overrides",
        name="Template No Overrides",
        enabled=True,
        template_ref=TemplateRef(id="tpl", version=1)
    )
    assert record.template_ref.id == "tpl"
    assert record.overrides is None

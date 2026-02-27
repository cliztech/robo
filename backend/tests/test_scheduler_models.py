from __future__ import annotations

import pytest
from pydantic import ValidationError

from backend.scheduling.scheduler_models import (
    SCHEDULE_OVERRIDE_FIELDS,
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

@pytest.mark.parametrize("field_name", SCHEDULE_OVERRIDE_FIELDS)
def test_duplicate_override_keys_parameterized(field_name):
    # Construct kwargs dynamically based on the field type
    top_level_value = None
    override_value = None

    if field_name == "timezone":
        top_level_value = "UTC"
        override_value = "America/New_York"
    elif field_name == "ui_state":
        top_level_value = UiState.active
        override_value = UiState.paused
    elif field_name == "priority":
        top_level_value = 50
        override_value = 60
    elif field_name == "start_window":
        top_level_value = ScheduleWindow(value="2024-01-01T00:00:00Z")
        override_value = ScheduleWindow(value="2024-01-02T00:00:00Z")
    elif field_name == "end_window":
        top_level_value = ScheduleWindow(value="2024-12-31T23:59:59Z")
        override_value = ScheduleWindow(value="2024-12-30T23:59:59Z")
    elif field_name == "content_refs":
        top_level_value = [ContentRef(type="script", ref_id="t1", weight=1)]
        override_value = [ContentRef(type="script", ref_id="t2", weight=1)]
    elif field_name == "schedule_spec":
        top_level_value = ScheduleSpec(mode="cron", cron="0 9 * * 1")
        override_value = ScheduleSpec(mode="cron", cron="0 10 * * 1")

    # Create the record with both top-level and override set
    kwargs = {
        "id": "duplicate_test",
        "name": "Duplicate Test",
        "enabled": True,
        "template_ref": TemplateRef(id="tpl", version=1),
        field_name: top_level_value,
        "overrides": ScheduleOverrides(**{field_name: override_value})
    }

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs)

    assert f"ambiguous configuration: {field_name} appears in both top-level and overrides" in str(excinfo.value)

@pytest.mark.parametrize("missing_field", SCHEDULE_OVERRIDE_FIELDS)
def test_standalone_schedule_missing_required_fields_parameterized(missing_field):
    # Start with a complete valid set of kwargs
    kwargs = _create_base_schedule_kwargs()

    # Remove the field being tested
    del kwargs[missing_field]

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs)

    assert "standalone schedule requires:" in str(excinfo.value)
    assert missing_field in str(excinfo.value)

def test_standalone_schedule_multiple_missing_fields():
    # Remove multiple fields
    kwargs = _create_base_schedule_kwargs()
    del kwargs["timezone"]
    del kwargs["priority"]

    with pytest.raises(ValidationError) as excinfo:
        ScheduleRecord(**kwargs)

    assert "standalone schedule requires:" in str(excinfo.value)
    assert "timezone" in str(excinfo.value)
    assert "priority" in str(excinfo.value)

@pytest.mark.parametrize(
    "start_dt,end_dt,start_in_override,end_in_override,should_pass",
    [
        # Happy paths
        ("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", False, False, True),  # Start < End (Top/Top)
        ("2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z", False, False, True),  # Start = End (Top/Top)
        ("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", True, False, True),   # Start < End (Override/Top)
        ("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", False, True, True),   # Start < End (Top/Override)
        ("2024-01-01T00:00:00Z", "2024-01-02T00:00:00Z", True, True, True),    # Start < End (Override/Override)

        # Failure paths
        ("2024-01-02T00:00:00Z", "2024-01-01T00:00:00Z", False, False, False), # Start > End (Top/Top)
        ("2024-01-02T00:00:00Z", "2024-01-01T00:00:00Z", True, False, False),  # Start > End (Override/Top)
        ("2024-01-02T00:00:00Z", "2024-01-01T00:00:00Z", False, True, False),  # Start > End (Top/Override)
        ("2024-01-02T00:00:00Z", "2024-01-01T00:00:00Z", True, True, False),   # Start > End (Override/Override)
    ],
)
def test_schedule_record_start_end_window_combinations(
    start_dt, end_dt, start_in_override, end_in_override, should_pass
):
    kwargs = _create_base_schedule_kwargs()

    # We always need a template_ref if we're using overrides
    if start_in_override or end_in_override:
        kwargs["template_ref"] = TemplateRef(id="tpl", version=1)
        kwargs["overrides"] = ScheduleOverrides()

        # When using template_ref, top-level fields become optional (as they might come from template)
        # However, our fixture sets them all. We should clear the ones we want to be "missing" or "overridden".
        # But wait, ScheduleRecord logic is:
        # effective = self.top_level if self.top_level else self.overrides.
        # Wait, looking at models.py:
        # def _effective(self, field_name: str):
        #    top_level = getattr(self, field_name)
        #    if top_level is not None:
        #        return top_level
        #    if self.overrides is not None:
        #        return getattr(self.overrides, field_name)
        #    return None
        #
        # Actually, the logic is PREFER TOP LEVEL.
        # "duplicate_keys" check ensures a key isn't in BOTH.
        # So if we put it in override, we must NOT put it in top level.

    start_val = ScheduleWindow(value=start_dt)
    end_val = ScheduleWindow(value=end_dt)

    # Configure Start Window
    if start_in_override:
        kwargs["start_window"] = None # Remove from top level
        kwargs["overrides"].start_window = start_val
    else:
        kwargs["start_window"] = start_val

    # Configure End Window
    if end_in_override:
        kwargs["end_window"] = None # Remove from top level
        kwargs["overrides"].end_window = end_val
    else:
        kwargs["end_window"] = end_val

    # If both are missing from top level (and not in overrides), that's invalid for standalone,
    # but valid for template-based IF we assume template provides them?
    # No, validation happens on the Record. The Record doesn't know about the template content at validation time.
    # The 'validate_shape' method checks:
    # start = self.effective_start_window()
    # end = self.effective_end_window()
    # if start and end: ... check logic

    # If we are using overrides, we MUST have template_ref.
    # If we have template_ref, top-level fields are OPTIONAL (assuming template provides them).
    # BUT, if they are missing from both top-level and overrides, effective() returns None.
    # Then the check 'if start and end' is skipped.

    # To test the logic, we must ensure effective() returns values.
    # So if not in top, MUST be in override for this test to be meaningful?
    # The parameterized inputs assume we are providing values, just deciding WHERE.

    if should_pass:
        ScheduleRecord(**kwargs)
    else:
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

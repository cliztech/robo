from datetime import datetime, timezone
from backend.status.evaluators import evaluate_queue_depth_alert, StatusThresholds
from backend.status.models import AlertSeverity

def test_evaluate_queue_depth_alert_below_warning():
    observed_at = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50)

    result = evaluate_queue_depth_alert(
        current_depth=29,
        observed_at=observed_at,
        thresholds=thresholds,
    )

    assert result is None

def test_evaluate_queue_depth_alert_at_warning():
    observed_at = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50)

    result = evaluate_queue_depth_alert(
        current_depth=30,
        observed_at=observed_at,
        thresholds=thresholds,
    )

    assert result is not None
    assert result.severity == AlertSeverity.warning
    assert "exceeds warning threshold 30" in result.description
    assert result.created_at == observed_at
    assert result.alert_id == "alert-queue-depth"

def test_evaluate_queue_depth_alert_above_warning():
    observed_at = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50)

    result = evaluate_queue_depth_alert(
        current_depth=49,
        observed_at=observed_at,
        thresholds=thresholds,
    )

    assert result is not None
    assert result.severity == AlertSeverity.warning
    assert "exceeds warning threshold 30" in result.description
    assert result.created_at == observed_at
    assert result.alert_id == "alert-queue-depth"

def test_evaluate_queue_depth_alert_at_critical():
    observed_at = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50)

    result = evaluate_queue_depth_alert(
        current_depth=50,
        observed_at=observed_at,
        thresholds=thresholds,
    )

    assert result is not None
    assert result.severity == AlertSeverity.critical
    assert "exceeds critical threshold 50" in result.description
    assert result.created_at == observed_at
    assert result.alert_id == "alert-queue-depth"

def test_evaluate_queue_depth_alert_above_critical():
    observed_at = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50)

    result = evaluate_queue_depth_alert(
        current_depth=100,
        observed_at=observed_at,
        thresholds=thresholds,
    )

    assert result is not None
    assert result.severity == AlertSeverity.critical
    assert "exceeds critical threshold 50" in result.description
    assert result.created_at == observed_at
    assert result.alert_id == "alert-queue-depth"

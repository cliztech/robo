import pytest
import json

def redact_log_payload(payload: dict) -> dict:
    # A mock implementation of the actual redaction policy logic that should
    # exist in the application backend
    redacted_keys = ["secret", "password", "token", "key", "api_key", "secret_v2"]
    result = {}
    for k, v in payload.items():
        if any(redacted_key in k.lower() for redacted_key in redacted_keys):
            result[k] = "[REDACTED]"
        elif isinstance(v, dict):
            result[k] = redact_log_payload(v)
        else:
            result[k] = v
    return result

def test_redaction_policy_positive_cases():
    """Verify that protected fields are redacted."""
    sensitive_payload = {
        "user": "admin",
        "api_key": "sk-12345abcdef",
        "secret_v2": "some-secret",
        "auth_token": "token-123",
        "nested": {
            "password": "my_super_password"
        }
    }
    
    redacted = redact_log_payload(sensitive_payload)
    
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["secret_v2"] == "[REDACTED]"
    assert redacted["auth_token"] == "[REDACTED]"
    assert redacted["nested"]["password"] == "[REDACTED]"
    assert redacted["user"] == "admin" # non-sensitive

def test_redaction_policy_negative_cases():
    """Verify that non-protected fields are not redacted."""
    safe_payload = {
        "event_type": "startup",
        "status": "PASS",
        "timestamp": "2026-02-25T10:00:00Z",
        "details": {
            "module": "autonomy_engine"
        }
    }
    
    redacted = redact_log_payload(safe_payload)
    
    assert redacted["event_type"] == "startup"
    assert redacted["status"] == "PASS"
    assert redacted["details"]["module"] == "autonomy_engine"

def test_redaction_policy_empty_and_null():
    """Verify redaction policy handles empty and null inputs gracefully."""
    assert redact_log_payload({}) == {}
    
    payload_with_nulls = {
        "api_key": None,
        "username": None
    }
    redacted = redact_log_payload(payload_with_nulls)
    
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["username"] is None

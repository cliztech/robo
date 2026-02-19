import os
import pytest
from datetime import datetime, timezone, timedelta
from unittest import mock
from backend.security.secret_integrity import run_secret_integrity_checks, SecretCheckResult

@pytest.fixture
def valid_secrets():
    """Returns a dictionary with valid secrets that satisfy the regex validators."""
    return {
        "ROBODJ_SECRET_KEY": "A" * 44,  # Matches ^[A-Za-z0-9_-]{43,}$
        "ROBODJ_SECRET_V2_KEY": "a" * 128,  # Matches ^[A-Fa-f0-9]{128}$
    }

@pytest.fixture
def mock_config_dir(tmp_path):
    """Mocks the CONFIG_DIR to point to a temporary directory."""
    with mock.patch("backend.security.secret_integrity.CONFIG_DIR", tmp_path):
        yield tmp_path

def test_valid_environment_variables(valid_secrets):
    """Test run_secret_integrity_checks with valid environment variables."""
    result = run_secret_integrity_checks(env=valid_secrets)
    assert result.ok is True
    assert result.alerts == []

def test_file_fallback_enabled(mock_config_dir, valid_secrets):
    """Test file fallback mechanism when enabled."""
    # Create valid secret files in the mock config directory
    (mock_config_dir / "secret.key").write_text(valid_secrets["ROBODJ_SECRET_KEY"], encoding="utf-8")
    (mock_config_dir / "secret_v2.key").write_text(valid_secrets["ROBODJ_SECRET_V2_KEY"], encoding="utf-8")

    # Enable file fallback via environment variable
    env = {
        "ROBODJ_ALLOW_FILE_SECRET_FALLBACK": "true",
        # Intentionally missing ROBODJ_SECRET_KEY and ROBODJ_SECRET_V2_KEY from env
    }

    result = run_secret_integrity_checks(env=env)
    assert result.ok is True
    assert result.alerts == []

def test_file_fallback_explicit_arg(mock_config_dir, valid_secrets):
    """Test file fallback mechanism when enabled via argument."""
    # Create valid secret files
    (mock_config_dir / "secret.key").write_text(valid_secrets["ROBODJ_SECRET_KEY"], encoding="utf-8")
    (mock_config_dir / "secret_v2.key").write_text(valid_secrets["ROBODJ_SECRET_V2_KEY"], encoding="utf-8")

    # Missing secrets in env, but allow_file_fallback=True passed explicitly
    result = run_secret_integrity_checks(env={}, allow_file_fallback=True)
    assert result.ok is True
    assert result.alerts == []

def test_missing_secrets():
    """Test that missing secrets (env and file) generate alerts."""
    result = run_secret_integrity_checks(env={})
    assert result.ok is False
    # Ensure specific alerts are present without enforcing strict count
    assert any("Missing secret.key" in alert for alert in result.alerts)
    assert any("Missing secret_v2.key" in alert for alert in result.alerts)

def test_placeholder_values():
    """Test that placeholder values generate alerts."""
    env = {
        "ROBODJ_SECRET_KEY": "REPLACE_WITH_GENERATED_KEY",
        "ROBODJ_SECRET_V2_KEY": "REPLACE_WITH_GENERATED_SECRET_V2_KEY",
    }
    result = run_secret_integrity_checks(env=env)
    assert result.ok is False
    # Ensure placeholder alerts are present without enforcing strict count
    assert any("secret.key contains placeholder text" in alert for alert in result.alerts)
    assert any("secret_v2.key contains placeholder text" in alert for alert in result.alerts)

def test_invalid_formats(valid_secrets):
    """Test that secrets not matching the regex validators generate alerts."""
    env = {
        "ROBODJ_SECRET_KEY": "short",  # Too short
        "ROBODJ_SECRET_V2_KEY": "123",  # Too short
    }
    result = run_secret_integrity_checks(env=env)
    assert result.ok is False
    assert any("secret.key from environment has an invalid format" in alert for alert in result.alerts)
    assert any("secret_v2.key from environment has an invalid format" in alert for alert in result.alerts)

def test_expired_secrets(valid_secrets):
    """Test that expired secrets generate alerts."""
    # Set expiration dates to the past
    env = {
        "ROBODJ_SECRET_KEY": valid_secrets["ROBODJ_SECRET_KEY"],
        "ROBODJ_SECRET_V2_KEY": valid_secrets["ROBODJ_SECRET_V2_KEY"],
        "ROBODJ_SECRET_KEY_EXPIRES_AT": "2023-01-01T00:00:00Z",
        "ROBODJ_SECRET_V2_KEY_EXPIRES_AT": "2023-01-01T00:00:00Z",
    }

    # Mock 'now' to be after the expiration date
    future_now = datetime(2023, 1, 2, tzinfo=timezone.utc)

    result = run_secret_integrity_checks(env=env, now=future_now)
    assert result.ok is False
    assert any("secret.key is expired as of" in alert for alert in result.alerts)
    assert any("secret_v2.key is expired as of" in alert for alert in result.alerts)

def test_valid_expiration(valid_secrets):
    """Test that future expiration dates do not generate alerts."""
    env = {
        "ROBODJ_SECRET_KEY": valid_secrets["ROBODJ_SECRET_KEY"],
        "ROBODJ_SECRET_V2_KEY": valid_secrets["ROBODJ_SECRET_V2_KEY"],
        "ROBODJ_SECRET_KEY_EXPIRES_AT": "2025-01-01T00:00:00Z",
        "ROBODJ_SECRET_V2_KEY_EXPIRES_AT": "2025-01-01T00:00:00Z",
    }

    # Mock 'now' to be before the expiration date
    past_now = datetime(2024, 1, 1, tzinfo=timezone.utc)

    result = run_secret_integrity_checks(env=env, now=past_now)
    assert result.ok is True
    assert result.alerts == []

def test_file_fallback_disabled(mock_config_dir, valid_secrets):
    """Test that file fallback is ignored if not enabled."""
    # Create valid secret files
    (mock_config_dir / "secret.key").write_text(valid_secrets["ROBODJ_SECRET_KEY"], encoding="utf-8")
    (mock_config_dir / "secret_v2.key").write_text(valid_secrets["ROBODJ_SECRET_V2_KEY"], encoding="utf-8")

    # Missing secrets in env, and fallback is disabled by default
    result = run_secret_integrity_checks(env={})
    assert result.ok is False
    assert any("File fallback is disabled" in alert for alert in result.alerts)

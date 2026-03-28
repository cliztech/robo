import pytest

from backend.runtime_env_validation import enforce_runtime_environment, validate_runtime_environment


def test_validate_runtime_environment_passes_for_ci_context() -> None:
    result = validate_runtime_environment(
        {
            'ROBODJ_RUNTIME_CONTEXT': 'ci',
            'ROBODJ_SECRET_KEY': 'A' * 44,
            'ROBODJ_SECRET_V2_KEY': 'a' * 128,
            'ROBODJ_SCHEDULER_API_KEY': 'B' * 32,
        }
    )

    assert result.ok is True
    assert result.context == 'ci'
    assert result.missing_keys == ()
    assert result.invalid_context is False


def test_validate_runtime_environment_fails_for_missing_required_keys() -> None:
    result = validate_runtime_environment({'ROBODJ_RUNTIME_CONTEXT': 'docker_stack'})

    assert result.ok is False
    assert result.context == 'docker_stack'
    assert result.invalid_context is False
    assert result.missing_keys == (
        'ROBODJ_SECRET_KEY',
        'ROBODJ_SECRET_V2_KEY',
        'ROBODJ_SCHEDULER_API_KEY',
    )


def test_enforce_runtime_environment_fails_for_invalid_context() -> None:
    with pytest.raises(RuntimeError, match='Runtime environment contract validation failed'):
        enforce_runtime_environment({'ROBODJ_RUNTIME_CONTEXT': 'invalid'})

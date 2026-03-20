import asyncio
import os
import time
from unittest import mock

import pytest
from fastapi import HTTPException

from backend.security.auth import (
    _get_secret_key,
    get_scheduler_api_key,
    invalidate_secret_key_cache,
    verify_api_key,
)


def test_verify_api_key_missing_key_response():
    async def _run():
        with pytest.raises(HTTPException) as exc:
            await verify_api_key(api_key=None)
        return exc

    exc = asyncio.run(_run())

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing API Key"


def test_verify_api_key_invalid_key_response():
    async def _run():
        invalidate_secret_key_cache(reason="test_setup")
        with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "expected_test_key"}, clear=False):
            with pytest.raises(HTTPException) as exc:
                await verify_api_key(api_key="invalid_test_key")
            return exc

    exc = asyncio.run(_run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid API Key"


def test_verify_api_key_missing_server_configured_key_response():
    async def _run():
        invalidate_secret_key_cache(reason="test_setup")
        with mock.patch.dict(os.environ, {}, clear=True):
            with pytest.raises(HTTPException) as exc:
                await verify_api_key(api_key="anything")
            return exc

    exc = asyncio.run(_run())
    assert exc.value.status_code == 500
    assert exc.value.detail == "Server configuration error: API Key not configured"


def test_get_scheduler_api_key_missing_key_response():
    with mock.patch.dict(os.environ, {"ROBODJ_SCHEDULER_API_KEY": "expected_test_key"}, clear=False):
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key=None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing API Key"


def test_get_scheduler_api_key_invalid_key_response():
    with mock.patch.dict(os.environ, {"ROBODJ_SCHEDULER_API_KEY": "expected_test_key"}, clear=False):
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key="invalid_test_key")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid API Key"


def test_get_scheduler_api_key_missing_server_configured_key_response():
    with mock.patch.dict(os.environ, {}, clear=True):
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key="anything")

    assert exc.value.status_code == 500
    assert exc.value.detail == "Server configuration error: Scheduler API key not configured"


def test_rotation_window_old_key_accepted_new_key_immediately_active():
    invalidate_secret_key_cache(reason="test_setup")
    now = time.time()
    env = {
        "ROBODJ_SECRET_KEY": "new-key",
        "ROBODJ_PREVIOUS_SECRET_KEY": "old-key",
        "ROBODJ_PREVIOUS_SECRET_KEY_GRACE_SECONDS": "600",
        "ROBODJ_SECRET_KEY_ROTATED_AT": str(now),
        "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-001",
    }

    with mock.patch.dict(os.environ, env, clear=True):
        asyncio.run(verify_api_key(api_key="new-key"))
        asyncio.run(verify_api_key(api_key="old-key"))


def test_rotation_window_old_key_rejected_after_expiry():
    invalidate_secret_key_cache(reason="test_setup")
    base_now = time.time()
    env = {
        "ROBODJ_SECRET_KEY": "new-key",
        "ROBODJ_PREVIOUS_SECRET_KEY": "old-key",
        "ROBODJ_PREVIOUS_SECRET_KEY_GRACE_SECONDS": "10",
        "ROBODJ_SECRET_KEY_ROTATED_AT": str(base_now),
        "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-002",
    }

    with mock.patch.dict(os.environ, env, clear=True):
        with mock.patch("backend.security.auth.time.time", return_value=base_now + 11):
            with pytest.raises(HTTPException) as exc:
                asyncio.run(verify_api_key(api_key="old-key"))

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid API Key"


def test_rotation_event_invalidation_refreshes_primary_key_without_ttl_wait():
    invalidate_secret_key_cache(reason="test_setup")
    with mock.patch.dict(
        os.environ,
        {
            "ROBODJ_SECRET_KEY": "key-one",
            "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-a",
            "ROBODJ_SECRET_KEY_CACHE_TTL_SECONDS": "3600",
        },
        clear=True,
    ):
        assert _get_secret_key() == "key-one"

    with mock.patch.dict(
        os.environ,
        {
            "ROBODJ_SECRET_KEY": "key-two",
            "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-b",
            "ROBODJ_SECRET_KEY_CACHE_TTL_SECONDS": "3600",
        },
        clear=True,
    ):
        assert _get_secret_key() == "key-two"


def test_audit_log_emits_on_source_change(caplog, tmp_path):
    caplog.set_level("INFO")
    invalidate_secret_key_cache(reason="test_setup")
    secret_file = tmp_path / "secret.key"
    secret_file.write_text("file-secret", encoding="utf-8")

    with mock.patch("backend.security.auth.CONFIG_DIR", tmp_path):
        with mock.patch.dict(
            os.environ,
            {
                "ROBODJ_ALLOW_FILE_SECRET_FALLBACK": "true",
                "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-file",
            },
            clear=True,
        ):
            _get_secret_key()

        with mock.patch.dict(
            os.environ,
            {
                "ROBODJ_SECRET_KEY": "env-secret",
                "ROBODJ_SECRET_KEY_ROTATION_EVENT_ID": "rotation-env",
            },
            clear=True,
        ):
            _get_secret_key()

    messages = [record.message for record in caplog.records]
    assert "security.api_key_source_changed" in messages
    assert all("env-secret" not in message and "file-secret" not in message for message in messages)

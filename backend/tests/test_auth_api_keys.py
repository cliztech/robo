import os
from unittest import mock

import asyncio
import pytest
from fastapi import HTTPException

from backend.security.auth import _get_secret_key, get_scheduler_api_key, verify_api_key


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
        _get_secret_key.cache_clear()
        with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "expected_mock"}, clear=False): # example
            with pytest.raises(HTTPException) as exc:
                await verify_api_key(api_key="wrong_mock") # example
                await verify_api_key(api_key="invalid_mock")
            return exc

    exc = asyncio.run(_run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid API Key"


def test_verify_api_key_missing_server_configured_key_response():
    async def _run():
        _get_secret_key.cache_clear()
        with mock.patch.dict(os.environ, {}, clear=True):
            with pytest.raises(HTTPException) as exc:
                await verify_api_key(api_key="anything") # example
                await verify_api_key(api_key="arbitrary_mock")
            return exc

    exc = asyncio.run(_run())
    assert exc.value.status_code == 500
    assert exc.value.detail == "Server configuration error: API Key not configured"


def test_get_scheduler_api_key_missing_key_response():
    with mock.patch.dict(os.environ, {"ROBODJ_SCHEDULER_API_KEY": "expected_mock"}, clear=False): # example
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key=None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing API Key"


def test_get_scheduler_api_key_invalid_key_response():
    with mock.patch.dict(os.environ, {"ROBODJ_SCHEDULER_API_KEY": "expected_mock"}, clear=False): # example
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key="wrong_mock") # example
            get_scheduler_api_key(api_key="invalid_mock")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid API Key"


def test_get_scheduler_api_key_missing_server_configured_key_response():
    with mock.patch.dict(os.environ, {}, clear=True):
        with pytest.raises(HTTPException) as exc:
            get_scheduler_api_key(api_key="anything") # example
            get_scheduler_api_key(api_key="arbitrary_mock")

    assert exc.value.status_code == 500
    assert exc.value.detail == "Server configuration error: Scheduler API key not configured"

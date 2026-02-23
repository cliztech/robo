import functools
import hmac
import os

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from backend.security.secret_integrity import CONFIG_DIR

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


@functools.lru_cache(maxsize=1)
def _get_secret_key() -> str | None:
    secret = os.environ.get("ROBODJ_SECRET_KEY")
    if secret:
        return secret

    allow_fallback = os.environ.get(
        "ROBODJ_ALLOW_FILE_SECRET_FALLBACK", ""
    ).lower() in ("true", "1", "yes", "on")
    if allow_fallback:
        secret_file = CONFIG_DIR / "secret.key"
        if secret_file.exists():
            try:
                return secret_file.read_text(encoding="utf-8").strip()
            except IOError:
                return None

    return None


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
        )

    expected_key = _get_secret_key()
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: API Key not configured",
        )

    if not hmac.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )

    return api_key


def get_scheduler_api_key(api_key: str = Security(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
        )

    expected_key = os.environ.get("ROBODJ_SCHEDULER_API_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: Scheduler API key not configured",
        )

    if not hmac.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )

    return api_key

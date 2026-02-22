import os
import hmac
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from backend.security.secret_integrity import CONFIG_DIR

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

@functools.lru_cache(maxsize=1)
def _get_secret_key() -> str | None:
    # 1. Try environment variable
    secret = os.environ.get("ROBODJ_SECRET_KEY")
    if secret:
        return secret

    # 2. Try file fallback if allowed
    allow_fallback = os.environ.get("ROBODJ_ALLOW_FILE_SECRET_FALLBACK", "").lower() in ("true", "1", "yes", "on")
    if allow_fallback:
        secret_file = CONFIG_DIR / "secret.key"
        if secret_file.exists():
            return secret_file.read_text(encoding="utf-8").strip()

    return None

async def verify_api_key(api_key: str = Security(api_key_header)):
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
        )

    expected_key = _get_secret_key()
    if not expected_key:
        # Security fail-safe: if no key is configured, deny all access
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: API Key not configured",
        )

    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(api_key, expected_key):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )

    return api_key

import hmac
import logging
import os
import secrets
import threading
import time
from dataclasses import dataclass

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from backend.security.secret_integrity import CONFIG_DIR

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

LOGGER = logging.getLogger(__name__)
_DEFAULT_CACHE_TTL_SECONDS = 30


@dataclass(frozen=True)
class SecretKeyBundle:
    primary_key: str | None
    previous_key: str | None
    previous_key_expires_at: float | None
    source: str
    loaded_at: float
    rotation_event_id: str


_SECRET_KEY_CACHE: SecretKeyBundle | None = None
_SECRET_KEY_CACHE_LOCK = threading.Lock()


def _cache_ttl_seconds() -> int:
    raw_value = os.environ.get("ROBODJ_SECRET_KEY_CACHE_TTL_SECONDS", str(_DEFAULT_CACHE_TTL_SECONDS))
    try:
        return max(1, int(raw_value))
    except (TypeError, ValueError):
        return _DEFAULT_CACHE_TTL_SECONDS


def _parse_rotation_timestamp() -> float | None:
    raw_value = os.environ.get("ROBODJ_SECRET_KEY_ROTATED_AT", "").strip()
    if not raw_value:
        return None
    try:
        return float(raw_value)
    except ValueError:
        LOGGER.warning("security.api_key_rotation_timestamp_invalid", extra={"event": "api_key_rotation_timestamp_invalid"})
        return None


def _resolve_primary_secret() -> tuple[str | None, str]:
    secret = os.environ.get("ROBODJ_SECRET_KEY")
    if secret:
        return secret, "env"

    allow_fallback = os.environ.get("ROBODJ_ALLOW_FILE_SECRET_FALLBACK", "").lower() in ("true", "1", "yes", "on")
    if allow_fallback:
        secret_file = CONFIG_DIR / "secret.key"
        if secret_file.exists():
            try:
                resolved = secret_file.read_text(encoding="utf-8").strip()
                return resolved or None, "file"
            except OSError:
                return None, "file"

    return None, "none"


def _resolve_previous_secret(now: float) -> tuple[str | None, float | None]:
    previous_secret = os.environ.get("ROBODJ_PREVIOUS_SECRET_KEY")
    if not previous_secret:
        return None, None

    grace_seconds_raw = os.environ.get("ROBODJ_PREVIOUS_SECRET_KEY_GRACE_SECONDS", "0")
    try:
        grace_seconds = max(0, int(grace_seconds_raw))
    except (TypeError, ValueError):
        grace_seconds = 0

    rotation_timestamp = _parse_rotation_timestamp()
    if grace_seconds <= 0 or rotation_timestamp is None:
        return None, None

    return previous_secret, rotation_timestamp + grace_seconds


def _emit_source_change_audit(previous: SecretKeyBundle | None, current: SecretKeyBundle) -> None:
    changed_source = previous is not None and previous.source != current.source
    changed_rotation = previous is not None and previous.rotation_event_id != current.rotation_event_id

    if previous is None:
        LOGGER.info(
            "security.api_key_source_initialized",
            extra={
                "event": "api_key_source_initialized",
                "source": current.source,
                "rotation_event_id": current.rotation_event_id or "none",
            },
        )
        return

    if changed_source or changed_rotation:
        LOGGER.info(
            "security.api_key_source_changed",
            extra={
                "event": "api_key_source_changed",
                "previous_source": previous.source,
                "source": current.source,
                "rotation_event": changed_rotation,
                "rotation_event_id": current.rotation_event_id or "none",
            },
        )


def _load_secret_key_bundle(now: float | None = None) -> SecretKeyBundle:
    current_time = now if now is not None else time.time()
    primary_key, source = _resolve_primary_secret()
    previous_key, previous_expires_at = _resolve_previous_secret(current_time)

    return SecretKeyBundle(
        primary_key=primary_key,
        previous_key=previous_key,
        previous_key_expires_at=previous_expires_at,
        source=source,
        loaded_at=current_time,
        rotation_event_id=os.environ.get("ROBODJ_SECRET_KEY_ROTATION_EVENT_ID", ""),
    )


def invalidate_secret_key_cache(reason: str = "manual") -> None:
    global _SECRET_KEY_CACHE
    with _SECRET_KEY_CACHE_LOCK:
        _SECRET_KEY_CACHE = None

    LOGGER.info(
        "security.api_key_cache_invalidated",
        extra={
            "event": "api_key_cache_invalidated",
            "reason": reason,
        },
    )


def _get_cached_secret_key_bundle(now: float | None = None) -> SecretKeyBundle:
    global _SECRET_KEY_CACHE
    current_time = now if now is not None else time.time()
    ttl_seconds = _cache_ttl_seconds()
    current_rotation_id = os.environ.get("ROBODJ_SECRET_KEY_ROTATION_EVENT_ID", "")

    with _SECRET_KEY_CACHE_LOCK:
        cached = _SECRET_KEY_CACHE
        requires_refresh = cached is None
        if cached is not None:
            requires_refresh = (
                current_time - cached.loaded_at >= ttl_seconds
                or cached.rotation_event_id != current_rotation_id
            )

        if requires_refresh:
            refreshed = _load_secret_key_bundle(now=current_time)
            _emit_source_change_audit(previous=cached, current=refreshed)
            _SECRET_KEY_CACHE = refreshed

        return _SECRET_KEY_CACHE


def _get_secret_key() -> str | None:
    """Compatibility accessor for tests and legacy call sites."""
    return _get_cached_secret_key_bundle().primary_key


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    """Validate global API key used by status and other operator endpoints."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
        )

    bundle = _get_cached_secret_key_bundle()
    if not bundle.primary_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: API Key not configured",
        )

    if hmac.compare_digest(api_key, bundle.primary_key):
        return api_key

    if (
        bundle.previous_key
        and bundle.previous_key_expires_at is not None
        and time.time() <= bundle.previous_key_expires_at
        and hmac.compare_digest(api_key, bundle.previous_key)
    ):
        return api_key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key",
    )


def get_scheduler_api_key(api_key: str | None = Security(api_key_header)) -> str:
    """Validate scheduler-specific API key for scheduler UI routes only."""
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

    if not secrets.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )

    return api_key

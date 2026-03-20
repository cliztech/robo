from __future__ import annotations

import base64
import hashlib
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


@dataclass(frozen=True)
class EnvelopeKey:
    kid: str
    key_bytes: bytes


class ConfigCryptoError(RuntimeError):
    """Base class for config encryption/decryption errors."""


class ConfigCryptoKeyError(ConfigCryptoError):
    """Raised when key material is unavailable or invalid."""


class ConfigCryptoEnvelopeError(ConfigCryptoError):
    """Raised when an encrypted envelope is malformed."""


class ConfigCryptoDecryptError(ConfigCryptoError):
    """Raised when envelope decryption fails."""


@dataclass(frozen=True)
class ConfigKeyMaterial:
    current_kid: str
    current_key: bytes
    decrypt_keys: dict[str, bytes]


ENVELOPE_VERSION = "v1"
ENVELOPE_ALGORITHM = "AES-256-GCM"
LEGACY_ENVELOPE_PREFIX = "enc::"

TI040_FIELD_MAP: dict[str, set[str]] = {
    "config/prompt_variables.json": {"openai_api_key", "tts_api_key"},
    "config/schedules.json": {
        "webhook_auth_token",
        "stream_fallback_password",
        "remote_ingest_secret",
    },
}


def config_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def serialize_json(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True)


def _digest_key(raw: str) -> bytes:
    token = raw.strip()
    if not token:
        raise ConfigCryptoKeyError("Empty key material")
    return hashlib.sha256(token.encode("utf-8")).digest()


def _read_key_file(path: Path) -> bytes:
    try:
        return _digest_key(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise ConfigCryptoKeyError(f"Unable to read key file: {path}") from exc


def load_key_material() -> ConfigKeyMaterial:
    primary_path = Path(os.getenv("CONFIG_ENCRYPTION_PRIMARY_KEY_PATH", "config/secret.key"))
    previous_path = Path(os.getenv("CONFIG_ENCRYPTION_PREVIOUS_KEY_PATH", "config/secret_v2.key"))

    current_kid = os.getenv("CONFIG_ENCRYPTION_PRIMARY_KID", "ti-004:primary")
    previous_kid = os.getenv("CONFIG_ENCRYPTION_PREVIOUS_KID", "ti-004:previous")

    current_key = _read_key_file(primary_path)
    decrypt_keys: dict[str, bytes] = {current_kid: current_key}

    if previous_path.exists():
        decrypt_keys[previous_kid] = _read_key_file(previous_path)

    return ConfigKeyMaterial(current_kid=current_kid, current_key=current_key, decrypt_keys=decrypt_keys)


def _as_envelope_key(keys: ConfigKeyMaterial) -> EnvelopeKey:
    return EnvelopeKey(kid=keys.current_kid, key_bytes=keys.current_key)


def _decode_base64(field_name: str, value: Any) -> bytes:
    if not isinstance(value, str):
        raise ConfigCryptoEnvelopeError(f"Envelope field '{field_name}' must be base64 string")
    try:
        return base64.b64decode(value, validate=True)
    except (ValueError, TypeError) as exc:
        raise ConfigCryptoEnvelopeError(f"Envelope field '{field_name}' is invalid base64") from exc


def envelope_encode(value: str, *, key: EnvelopeKey, aad: str = "") -> dict[str, Any]:
    nonce = os.urandom(12)
    ciphertext_with_tag = AESGCM(key.key_bytes).encrypt(nonce, value.encode("utf-8"), aad.encode("utf-8"))
    ciphertext, tag = ciphertext_with_tag[:-16], ciphertext_with_tag[-16:]
    return {
        "enc_v": ENVELOPE_VERSION,
        "alg": ENVELOPE_ALGORITHM,
        "kid": key.kid,
        "nonce_b64": base64.b64encode(nonce).decode("ascii"),
        "ciphertext_b64": base64.b64encode(ciphertext).decode("ascii"),
        "tag_b64": base64.b64encode(tag).decode("ascii"),
    }


def _normalize_envelope(envelope: dict[str, Any]) -> dict[str, Any]:
    if envelope.get("enc_v") not in {ENVELOPE_VERSION, 1}:
        raise ConfigCryptoEnvelopeError("Unsupported encrypted envelope version")
    if envelope.get("alg") not in {ENVELOPE_ALGORITHM, "XOR-HMAC-SHA256"}:
        raise ConfigCryptoEnvelopeError("Unsupported encrypted envelope algorithm")

    # Legacy envelopes may use nonce/ciphertext/tag names.
    nonce_b64 = envelope.get("nonce_b64", envelope.get("nonce"))
    ciphertext_b64 = envelope.get("ciphertext_b64", envelope.get("ciphertext"))
    tag_b64 = envelope.get("tag_b64", envelope.get("tag"))

    if not isinstance(envelope.get("kid"), str) or not envelope.get("kid"):
        raise ConfigCryptoEnvelopeError("Envelope field 'kid' is required")

    return {
        "kid": envelope["kid"],
        "nonce_b64": nonce_b64,
        "ciphertext_b64": ciphertext_b64,
        "tag_b64": tag_b64,
    }


def envelope_decode(envelope: dict[str, Any], *, key_lookup: dict[str, EnvelopeKey], aad: str = "") -> str:
    normalized = _normalize_envelope(envelope)
    key = key_lookup.get(normalized["kid"])
    if key is None:
        raise ConfigCryptoDecryptError(f"Unknown key id '{normalized['kid']}'")

    nonce = _decode_base64("nonce_b64", normalized["nonce_b64"])
    ciphertext = _decode_base64("ciphertext_b64", normalized["ciphertext_b64"])
    tag = _decode_base64("tag_b64", normalized["tag_b64"])

    try:
        plaintext = AESGCM(key.key_bytes).decrypt(nonce, ciphertext + tag, aad.encode("utf-8"))
    except Exception as exc:
        raise ConfigCryptoDecryptError("Ciphertext authentication failed") from exc
    return plaintext.decode("utf-8")


def _target_ref(config_path: Path) -> str | None:
    normalized = config_path.as_posix()
    for suffix in TI040_FIELD_MAP:
        if normalized.endswith(suffix):
            return suffix
    return None


def _transform_sensitive_values(
    payload: Any,
    *,
    sensitive_keys: set[str],
    encode: bool,
    key: EnvelopeKey | None = None,
    key_lookup: dict[str, EnvelopeKey] | None = None,
    field_ref_base: str | None = None,
) -> Any:
    if isinstance(payload, dict):
        transformed: dict[str, Any] = {}
        for k, v in payload.items():
            key_name = str(k)
            if key_name in sensitive_keys:
                if encode and isinstance(v, str):
                    if key is None:
                        transformed[k] = v
                    else:
                        envelope = envelope_encode(v, key=key, aad=key_name)
                        if field_ref_base:
                            envelope["aad"] = {
                                "field_ref": f"{field_ref_base}:{key_name}",
                                "env": os.getenv("APP_ENV", "dev"),
                                "issued_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
                            }
                        transformed[k] = envelope
                elif not encode:
                    candidate = v
                    if isinstance(candidate, str) and candidate.startswith(LEGACY_ENVELOPE_PREFIX):
                        candidate = json.loads(candidate[len(LEGACY_ENVELOPE_PREFIX) :])
                    if isinstance(candidate, dict) and "enc_v" in candidate:
                        transformed[k] = envelope_decode(candidate, key_lookup=key_lookup or {}, aad=key_name)
                    else:
                        transformed[k] = candidate
                else:
                    transformed[k] = v
            else:
                transformed[k] = _transform_sensitive_values(
                    v,
                    sensitive_keys=sensitive_keys,
                    encode=encode,
                    key=key,
                    key_lookup=key_lookup,
                    field_ref_base=field_ref_base,
                )
        return transformed

    if isinstance(payload, list):
        return [
            _transform_sensitive_values(
                item,
                sensitive_keys=sensitive_keys,
                encode=encode,
                key=key,
                key_lookup=key_lookup,
                field_ref_base=field_ref_base,
            )
            for item in payload
        ]

    return payload


def transform_sensitive_values(
    payload: Any,
    *,
    sensitive_keys: set[str],
    encode: bool,
    key: EnvelopeKey | None = None,
    key_lookup: dict[str, EnvelopeKey] | None = None,
) -> Any:
    return _transform_sensitive_values(
        payload,
        sensitive_keys=sensitive_keys,
        encode=encode,
        key=key,
        key_lookup=key_lookup,
    )


def encrypt_config_payload(config_path: Path, payload: Any, *, keys: ConfigKeyMaterial | None = None) -> Any:
    target_ref = _target_ref(config_path)
    if target_ref is None:
        return payload
    effective_key = _as_envelope_key(keys) if keys is not None else None
    return _transform_sensitive_values(
        payload,
        sensitive_keys=TI040_FIELD_MAP[target_ref],
        encode=True,
        key=effective_key,
        field_ref_base=target_ref,
    )


def decrypt_config_payload(config_path: Path, payload: Any, *, keys: ConfigKeyMaterial | None = None) -> Any:
    target_ref = _target_ref(config_path)
    if target_ref is None:
        return payload
    key_lookup = {}
    if keys is not None:
        key_lookup = {kid: EnvelopeKey(kid=kid, key_bytes=key_bytes) for kid, key_bytes in keys.decrypt_keys.items()}
    return _transform_sensitive_values(
        payload,
        sensitive_keys=TI040_FIELD_MAP[target_ref],
        encode=False,
        key_lookup=key_lookup,
        field_ref_base=target_ref,
    )


def load_config_json(config_path: Path, *, keys: ConfigKeyMaterial | None = None) -> Any:
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    return decrypt_config_payload(config_path, payload, keys=keys)


def dump_config_json(config_path: Path, payload: Any, *, indent: int = 2, keys: ConfigKeyMaterial | None = None) -> str:
    encrypted = encrypt_config_payload(config_path, payload, keys=keys)
    return json.dumps(encrypted, indent=indent)

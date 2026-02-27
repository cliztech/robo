from __future__ import annotations

import base64
import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENVELOPE_VERSION = "v1"
ENVELOPE_ALGORITHM = "AES-256-GCM"
ENVELOPE_PREFIX = "enc::"

TI040_FIELD_MAP: dict[str, set[str]] = {
    "config/prompt_variables.json": {
        "openai_api_key",
        "tts_api_key",
    },
    "config/schedules.json": {
        "webhook_auth_token",
        "stream_fallback_password",
        "remote_ingest_secret",
    },
}


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
    """Load TI-004-aligned primary/previous keys and KID provenance metadata."""

    primary_path = Path(os.getenv("CONFIG_ENCRYPTION_PRIMARY_KEY_PATH", "config/secret.key"))
    previous_path = Path(os.getenv("CONFIG_ENCRYPTION_PREVIOUS_KEY_PATH", "config/secret_v2.key"))

    current_kid = os.getenv("CONFIG_ENCRYPTION_PRIMARY_KID", "ti-004:primary")
    previous_kid = os.getenv("CONFIG_ENCRYPTION_PREVIOUS_KID", "ti-004:previous")

    current_key = _read_key_file(primary_path)
    decrypt_keys: dict[str, bytes] = {current_kid: current_key}

    if previous_path.exists():
        decrypt_keys[previous_kid] = _read_key_file(previous_path)

    return ConfigKeyMaterial(current_kid=current_kid, current_key=current_key, decrypt_keys=decrypt_keys)


def _target_fields(config_path: Path) -> set[str]:
    normalized = config_path.as_posix()
    for suffix, fields in TI040_FIELD_MAP.items():
        if normalized.endswith(suffix):
            return fields
    return set()


def _encode_envelope(envelope: dict[str, str]) -> str:
    return ENVELOPE_PREFIX + json.dumps(envelope, separators=(",", ":"), sort_keys=True)


def _decode_envelope(value: str) -> dict[str, str]:
    if not value.startswith(ENVELOPE_PREFIX):
        raise ConfigCryptoEnvelopeError("Envelope prefix missing")
    body = value[len(ENVELOPE_PREFIX) :]
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ConfigCryptoEnvelopeError("Encrypted envelope JSON is unreadable") from exc

    required = {"enc_v", "alg", "kid", "nonce", "ciphertext", "tag"}
    missing = required - set(payload.keys())
    if missing:
        raise ConfigCryptoEnvelopeError(f"Encrypted envelope missing required fields: {sorted(missing)}")
    if payload.get("enc_v") != ENVELOPE_VERSION or payload.get("alg") != ENVELOPE_ALGORITHM:
        raise ConfigCryptoEnvelopeError("Unsupported encrypted envelope version or algorithm")
    return payload


def _encrypt_value(plaintext: str, *, field_ref: str, keys: ConfigKeyMaterial) -> str:
    nonce = os.urandom(12)
    aad = field_ref.encode("utf-8")
    raw = AESGCM(keys.current_key).encrypt(nonce, plaintext.encode("utf-8"), aad)
    ciphertext, tag = raw[:-16], raw[-16:]
    envelope = {
        "enc_v": ENVELOPE_VERSION,
        "alg": ENVELOPE_ALGORITHM,
        "kid": keys.current_kid,
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
        "tag": base64.b64encode(tag).decode("ascii"),
    }
    return _encode_envelope(envelope)


def _decrypt_value(serialized: str, *, field_ref: str, keys: ConfigKeyMaterial) -> str:
    envelope = _decode_envelope(serialized)
    kid = envelope["kid"]
    key = keys.decrypt_keys.get(kid)
    if key is None:
        raise ConfigCryptoDecryptError(f"Unknown encryption key id: {kid}")

    try:
        nonce = base64.b64decode(envelope["nonce"], validate=True)
        ciphertext = base64.b64decode(envelope["ciphertext"], validate=True)
        tag = base64.b64decode(envelope["tag"], validate=True)
    except (ValueError, TypeError) as exc:
        raise ConfigCryptoEnvelopeError("Encrypted envelope base64 payload is unreadable") from exc

    try:
        plaintext = AESGCM(key).decrypt(nonce, ciphertext + tag, field_ref.encode("utf-8"))
    except Exception as exc:  # cryptography raises InvalidTag
        raise ConfigCryptoDecryptError(f"Unable to decrypt encrypted config field: {field_ref}") from exc
    return plaintext.decode("utf-8")


def _transform(node: Any, *, fields: set[str], keys: ConfigKeyMaterial | None, encrypt: bool, file_ref: str) -> Any:
    if isinstance(node, dict):
        transformed: dict[str, Any] = {}
        for key, value in node.items():
            if key in fields and isinstance(value, str):
                field_ref = f"{file_ref}:{key}"
                if encrypt:
                    if value.startswith(ENVELOPE_PREFIX):
                        transformed[key] = value
                    else:
                        effective_keys = keys or load_key_material()
                        transformed[key] = _encrypt_value(value, field_ref=field_ref, keys=effective_keys)
                else:
                    if value.startswith(ENVELOPE_PREFIX):
                        effective_keys = keys or load_key_material()
                        transformed[key] = _decrypt_value(value, field_ref=field_ref, keys=effective_keys)
                    else:
                        transformed[key] = value
            else:
                transformed[key] = _transform(value, fields=fields, keys=keys, encrypt=encrypt, file_ref=file_ref)
        return transformed
    if isinstance(node, list):
        return [_transform(item, fields=fields, keys=keys, encrypt=encrypt, file_ref=file_ref) for item in node]
    return node


def encrypt_config_payload(config_path: Path, payload: Any, *, keys: ConfigKeyMaterial | None = None) -> Any:
    fields = _target_fields(config_path)
    if not fields:
        return payload
    return _transform(
        payload,
        fields=fields,
        keys=keys,
        encrypt=True,
        file_ref=next(k for k in TI040_FIELD_MAP if config_path.as_posix().endswith(k)),
    )


def decrypt_config_payload(config_path: Path, payload: Any, *, keys: ConfigKeyMaterial | None = None) -> Any:
    fields = _target_fields(config_path)
    if not fields:
        return payload
    return _transform(
        payload,
        fields=fields,
        keys=keys,
        encrypt=False,
        file_ref=next(k for k in TI040_FIELD_MAP if config_path.as_posix().endswith(k)),
    )


def load_config_json(config_path: Path, *, keys: ConfigKeyMaterial | None = None) -> Any:
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    return decrypt_config_payload(config_path, payload, keys=keys)


def dump_config_json(config_path: Path, payload: Any, *, indent: int = 2, keys: ConfigKeyMaterial | None = None) -> str:
    encrypted = encrypt_config_payload(config_path, payload, keys=keys)
    return json.dumps(encrypted, indent=indent)

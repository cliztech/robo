from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class EnvelopeKey:
    kid: str
    key_bytes: bytes


def config_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _b64_encode(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _b64_decode(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"), validate=True)


def _xor_stream(data: bytes, key: bytes, nonce: bytes) -> bytes:
    out = bytearray(len(data))
    counter = 0
    offset = 0
    while offset < len(data):
        block = hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest()
        for i, b in enumerate(block):
            if offset + i >= len(data):
                break
            out[offset + i] = data[offset + i] ^ b
        offset += len(block)
        counter += 1
    return bytes(out)


def envelope_encode(value: str, *, key: EnvelopeKey, aad: str = "") -> dict[str, str | int]:
    nonce = os.urandom(12)
    plaintext = value.encode("utf-8")
    ciphertext = _xor_stream(plaintext, key.key_bytes, nonce)
    tag = hmac.new(key.key_bytes, aad.encode("utf-8") + nonce + ciphertext, hashlib.sha256).digest()[:16]
    return {
        "enc_v": 1,
        "alg": "XOR-HMAC-SHA256",
        "kid": key.kid,
        "nonce": _b64_encode(nonce),
        "ciphertext": _b64_encode(ciphertext),
        "tag": _b64_encode(tag),
    }


def envelope_decode(envelope: dict[str, Any], *, key_lookup: dict[str, EnvelopeKey], aad: str = "") -> str:
    for field in ("enc_v", "alg", "kid", "nonce", "ciphertext", "tag"):
        if field not in envelope:
            raise ValueError(f"Encrypted envelope missing field '{field}'")

    if envelope["enc_v"] != 1 or not str(envelope["alg"]):
        raise ValueError("Unsupported envelope contract")

    kid = str(envelope["kid"])
    if kid not in key_lookup:
        raise ValueError(f"Unknown key id '{kid}'")

    nonce = _b64_decode(str(envelope["nonce"]))
    ciphertext = _b64_decode(str(envelope["ciphertext"]))
    tag = _b64_decode(str(envelope["tag"]))

    key = key_lookup[kid].key_bytes
    expected_tag = hmac.new(key, aad.encode("utf-8") + nonce + ciphertext, hashlib.sha256).digest()[:16]
    if not hmac.compare_digest(tag, expected_tag):
        raise ValueError("Ciphertext authentication failed")

    decrypted = _xor_stream(ciphertext, key, nonce)
    return decrypted.decode("utf-8")


def transform_sensitive_values(
    payload: Any,
    *,
    sensitive_keys: set[str],
    encode: bool,
    key: EnvelopeKey | None = None,
    key_lookup: dict[str, EnvelopeKey] | None = None,
) -> Any:
    if isinstance(payload, dict):
        transformed: dict[str, Any] = {}
        for k, v in payload.items():
            key_name = str(k).lower()
            if key_name in sensitive_keys and isinstance(v, str):
                if encode:
                    transformed[k] = envelope_encode(v, key=key, aad=key_name) if key else v
                else:
                    transformed[k] = envelope_decode(v, key_lookup=key_lookup or {}, aad=key_name) if isinstance(v, dict) and "enc_v" in v else v
            else:
                transformed[k] = transform_sensitive_values(
                    v,
                    sensitive_keys=sensitive_keys,
                    encode=encode,
                    key=key,
                    key_lookup=key_lookup,
                )
        return transformed

    if isinstance(payload, list):
        return [
            transform_sensitive_values(item, sensitive_keys=sensitive_keys, encode=encode, key=key, key_lookup=key_lookup)
            for item in payload
        ]

    return payload


def serialize_json(payload: Any) -> str:
    return json.dumps(payload, indent=2, sort_keys=True)
from dataclasses import dataclass
from pathlib import Path

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

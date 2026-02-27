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

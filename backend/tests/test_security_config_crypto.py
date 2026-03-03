from __future__ import annotations

import pytest

from backend.security.config_crypto import EnvelopeKey, envelope_decode, envelope_encode


def test_envelope_round_trip():
    key = EnvelopeKey(kid="k1", key_bytes=b"0123456789abcdef0123456789abcdef")
    envelope = envelope_encode("super-secret", key=key, aad="secret")

    decrypted = envelope_decode(envelope, key_lookup={"k1": key}, aad="secret")

    assert decrypted == "super-secret"


def test_envelope_tamper_detection():
    key = EnvelopeKey(kid="k1", key_bytes=b"0123456789abcdef0123456789abcdef")
    envelope = envelope_encode("super-secret", key=key, aad="secret")
    envelope["ciphertext"] = envelope["ciphertext"][:-2] + "AA"

    with pytest.raises(Exception):
        envelope_decode(envelope, key_lookup={"k1": key}, aad="secret")

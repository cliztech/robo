from __future__ import annotations

import json
from pathlib import Path

import pytest

from backend.security.config_crypto import (
    ConfigCryptoDecryptError,
    ConfigKeyMaterial,
    decrypt_config_payload,
    dump_config_json,
    encrypt_config_payload,
)


def _keys() -> ConfigKeyMaterial:
    return ConfigKeyMaterial(
        current_kid="ti-004:primary",
        current_key=b"1" * 32,
        decrypt_keys={"ti-004:primary": b"1" * 32, "ti-004:previous": b"2" * 32},
    )


def test_round_trip_encryption_decryption() -> None:
    payload = {"openai_api_key": "sk-live-123", "other": "safe"}
    encrypted = encrypt_config_payload(Path("config/prompt_variables.json"), payload, keys=_keys())
    assert encrypted["openai_api_key"].startswith("enc::")

    decrypted = decrypt_config_payload(Path("config/prompt_variables.json"), encrypted, keys=_keys())
    assert decrypted == payload


def test_wrong_key_fails_closed() -> None:
    payload = {"openai_api_key": "sk-live-123"}
    encrypted = encrypt_config_payload(Path("config/prompt_variables.json"), payload, keys=_keys())

    wrong = ConfigKeyMaterial(current_kid="x", current_key=b"3" * 32, decrypt_keys={"ti-004:primary": b"3" * 32})
    with pytest.raises(ConfigCryptoDecryptError):
        decrypt_config_payload(Path("config/prompt_variables.json"), encrypted, keys=wrong)


def test_nonce_uniqueness() -> None:
    payload = {"openai_api_key": "same-secret"}
    one = encrypt_config_payload(Path("config/prompt_variables.json"), payload, keys=_keys())
    two = encrypt_config_payload(Path("config/prompt_variables.json"), payload, keys=_keys())

    first_envelope = json.loads(one["openai_api_key"][len("enc::") :])
    second_envelope = json.loads(two["openai_api_key"][len("enc::") :])
    assert first_envelope["nonce"] != second_envelope["nonce"]


def test_schema_preserving_targeted_edits() -> None:
    payload = {
        "schema_version": 2,
        "schedules": [
            {
                "id": "1",
                "name": "Test",
                "enabled": True,
                "webhook_auth_token": "wh-123",
                "non_secret": "keep",
            }
        ],
    }

    encrypted = encrypt_config_payload(Path("config/schedules.json"), payload, keys=_keys())
    assert set(encrypted.keys()) == set(payload.keys())
    assert set(encrypted["schedules"][0].keys()) == set(payload["schedules"][0].keys())
    assert encrypted["schedules"][0]["non_secret"] == "keep"
    assert encrypted["schedules"][0]["webhook_auth_token"].startswith("enc::")


def test_dump_json_stays_valid_and_decryptable(tmp_path: Path) -> None:
    config_path = tmp_path / "prompt_variables.json"
    payload = {"openai_api_key": "sk-live", "version": "v1"}
    config_path.write_text(dump_config_json(Path("config/prompt_variables.json"), payload, keys=_keys()), encoding="utf-8")

    file_payload = json.loads(config_path.read_text(encoding="utf-8"))
    decrypted = decrypt_config_payload(Path("config/prompt_variables.json"), file_payload, keys=_keys())
    assert decrypted == payload

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = REPO_ROOT / "config"

SECRET_SPECS = (
    {
        "name": "secret.key",
        "env_var": "ROBODJ_SECRET_KEY",
        "file_name": "secret.key",
        "placeholder_values": {
            "REPLACE_WITH_GENERATED_KEY",
            "REPLACE_WITH_GENERATED_SECRET_KEY",
        },
        "validators": (
            re.compile(r"^[A-Za-z0-9_-]{43,}$"),
            re.compile(r"^[A-Fa-f0-9]{64,}$"),
        ),
        "expires_env_var": "ROBODJ_SECRET_KEY_EXPIRES_AT",
        "owner": "Security Operations",
        "rotation_days": 90,
    },
    {
        "name": "secret_v2.key",
        "env_var": "ROBODJ_SECRET_V2_KEY",
        "file_name": "secret_v2.key",
        "placeholder_values": {
            "REPLACE_WITH_GENERATED_KEY",
            "REPLACE_WITH_GENERATED_SECRET_V2_KEY",
        },
        "validators": (
            re.compile(r"^[A-Fa-f0-9]{128}$"),
            re.compile(r"^[A-Za-z0-9_-]{86,}$"),
        ),
        "expires_env_var": "ROBODJ_SECRET_V2_KEY_EXPIRES_AT",
        "owner": "Security Operations",
        "rotation_days": 30,
    },
)


@dataclass
class SecretCheckResult:
    alerts: list[str]

    @property
    def ok(self) -> bool:
        return not self.alerts


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}



def _load_from_file(file_name: str) -> str | None:
    file_path = CONFIG_DIR / file_name
    if not file_path.exists():
        return None
    value = file_path.read_text(encoding="utf-8").strip()
    return value or None



def _parse_iso8601(value: str, env_var: str) -> datetime:
    normalized = value.strip().replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        raise ValueError(f"{env_var} must include timezone information")
    return parsed.astimezone(timezone.utc)



def run_secret_integrity_checks(
    env: Mapping[str, str] | None = None,
    *,
    now: datetime | None = None,
    allow_file_fallback: bool | None = None,
) -> SecretCheckResult:
    source_env = env if env is not None else os.environ
    current_time = now.astimezone(timezone.utc) if now else datetime.now(timezone.utc)
    alerts: list[str] = []
    allow_file_fallback = (
        _is_truthy(source_env.get("ROBODJ_ALLOW_FILE_SECRET_FALLBACK"))
        if allow_file_fallback is None
        else allow_file_fallback
    )

    for spec in SECRET_SPECS:
        value = source_env.get(spec["env_var"])
        source = "environment"

        if not value and allow_file_fallback:
            value = _load_from_file(spec["file_name"])
            source = f"file:{spec['file_name']}"

        if not value:
            if allow_file_fallback:
                alerts.append(
                    f"ALERT: Missing {spec['name']}. Set {spec['env_var']} (preferred) or provision config/{spec['file_name']}."
                )
            else:
                alerts.append(
                    f"ALERT: Missing {spec['name']}. Set {spec['env_var']} in the environment. "
                    "File fallback is disabled unless ROBODJ_ALLOW_FILE_SECRET_FALLBACK=true."
                )
            continue

        if value in spec["placeholder_values"]:
            alerts.append(
                f"ALERT: {spec['name']} contains placeholder text from {source}; provision a real key before startup."
            )

        if not any(pattern.match(value) for pattern in spec["validators"]):
            alerts.append(
                f"ALERT: {spec['name']} from {source} has an invalid format and failed integrity checks."
            )

        expires_at_value = source_env.get(spec["expires_env_var"])
        if expires_at_value:
            try:
                expires_at = _parse_iso8601(expires_at_value, spec["expires_env_var"])
            except ValueError as exc:
                alerts.append(f"ALERT: {exc}")
                continue

            if expires_at <= current_time:
                alerts.append(
                    f"ALERT: {spec['name']} is expired as of {expires_at.isoformat()} and must be rotated by {spec['owner']}."
                )

    return SecretCheckResult(alerts=alerts)

#!/usr/bin/env python3
"""Pre-release secret presence and integrity validation for RoboDJ runtime."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.security.secret_integrity import SECRET_SPECS, run_secret_integrity_checks


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _file_contains_real_key_material(file_path: Path, placeholder_values: set[str], validators: tuple[re.Pattern[str], ...]) -> bool:
    if not file_path.exists():
        return False

    value = file_path.read_text(encoding="utf-8").strip()
    if not value or value in placeholder_values:
        return False

    return any(pattern.match(value) for pattern in validators)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check runtime secret integrity without printing key material")
    parser.add_argument(
        "--require-env-only",
        action="store_true",
        help=(
            "Require runtime secrets to be environment-backed only and fail if real key material is present in "
            "config/secret.key or config/secret_v2.key."
        ),
    )
    args = parser.parse_args()

    protected_environment = _is_truthy(os.environ.get("ROBODJ_PROTECTED_ENV"))
    enforce_env_only = args.require_env_only or protected_environment
    result = run_secret_integrity_checks(
        allow_file_fallback=False if enforce_env_only else None,
    )
    alerts = list(result.alerts)

    if enforce_env_only:
        for spec in SECRET_SPECS:
            if not os.environ.get(spec["env_var"]):
                alerts.append(f"ALERT: {spec['env_var']} is required in environment for protected runtime checks.")

            file_path = REPO_ROOT / "config" / spec["file_name"]
            if _file_contains_real_key_material(file_path, spec["placeholder_values"], spec["validators"]):
                alerts.append(
                    f"ALERT: Protected runtime policy violation: real key material detected in config/{spec['file_name']}. "
                    "Use environment-provided secrets instead."
                )

    if alerts:
        print("Secret integrity check failed:", file=sys.stderr)
        for alert in alerts:
            print(f" - {alert}", file=sys.stderr)
        return 1

    print("Secret integrity check passed (key material redacted).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

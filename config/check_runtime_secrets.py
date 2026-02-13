#!/usr/bin/env python3
"""Pre-release secret presence and integrity validation for RoboDJ runtime."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.security.secret_integrity import run_secret_integrity_checks


def main() -> int:
    parser = argparse.ArgumentParser(description="Check runtime secret integrity without printing key material")
    parser.add_argument(
        "--require-env-only",
        action="store_true",
        help="Require ROBODJ_SECRET_KEY and ROBODJ_SECRET_V2_KEY to come from environment variables.",
    )
    args = parser.parse_args()

    result = run_secret_integrity_checks()
    alerts = list(result.alerts)

    if args.require_env_only:
        if not os.environ.get("ROBODJ_SECRET_KEY"):
            alerts.append("ALERT: ROBODJ_SECRET_KEY is required in environment for pre-release checks.")
        if not os.environ.get("ROBODJ_SECRET_V2_KEY"):
            alerts.append("ALERT: ROBODJ_SECRET_V2_KEY is required in environment for pre-release checks.")

    if alerts:
        print("Secret integrity check failed:", file=sys.stderr)
        for alert in alerts:
            print(f" - {alert}", file=sys.stderr)
        return 1

    print("Secret integrity check passed (key material redacted).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

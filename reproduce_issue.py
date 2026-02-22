from datetime import datetime, timezone
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from backend.security.secret_integrity import run_secret_integrity_checks

def test_reproduce():
    env = {
        "ROBODJ_SECRET_KEY": "A" * 44,
        "ROBODJ_SECRET_V2_KEY": "a" * 128,
        "ROBODJ_SECRET_KEY_EXPIRES_AT": "invalid-date-format",
    }

    result = run_secret_integrity_checks(env=env)

    print("Alerts:", result.alerts)

    expected_alert_part = "ROBODJ_SECRET_KEY_EXPIRES_AT"
    found = any(expected_alert_part in alert and "Invalid isoformat string" in alert for alert in result.alerts)

    if result.ok is False and len(result.alerts) > 0:
        print("Successfully reproduced: Alert generated for invalid date.")
    else:
        print("Failed to reproduce: No alert generated.")

if __name__ == "__main__":
    test_reproduce()

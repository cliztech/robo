#!/usr/bin/env bash
set -euo pipefail

if [[ -f "./RoboDJ Automation.exe" ]]; then
    echo "Runtime smoke check: RoboDJ Automation.exe is present."
else
    echo "Runtime smoke check: RoboDJ Automation.exe not found (allowed in Linux checkout)."
fi

if [[ -f "./RoboDJ_Launcher.bat" ]]; then
    echo "Runtime smoke check: RoboDJ_Launcher.bat is present."
else
    echo "Runtime smoke check failed: RoboDJ_Launcher.bat missing." >&2
    exit 1
fi

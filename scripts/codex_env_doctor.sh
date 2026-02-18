#!/usr/bin/env bash
set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

failures=0
warnings=0

run_check() {
    local label="$1"
    shift

    if "$@" >/dev/null 2>&1; then
        printf 'PASS: %s\n' "$label"
    else
        printf 'FAIL: %s\n' "$label"
        failures=$((failures + 1))
    fi
}

warn_if_missing() {
    local path="$1"
    if [[ -f "$REPO_ROOT/$path" ]]; then
        printf 'PASS: Optional key file present (%s)\n' "$path"
    else
        printf 'WARN: Optional key file missing (%s)\n' "$path"
        warnings=$((warnings + 1))
    fi
}

run_check "bootstrap_dev_environment.sh" "$REPO_ROOT/scripts/bootstrap_dev_environment.sh"
run_check "config/validate_config.py" python "$REPO_ROOT/config/validate_config.py"
run_check "config/check_runtime_secrets.py --require-env-only" python "$REPO_ROOT/config/check_runtime_secrets.py" --require-env-only

warn_if_missing "config/secret.key"
warn_if_missing "config/secret_v2.key"

if (( failures > 0 )); then
    printf 'FAIL: codex_env_doctor completed with %d failure(s), %d warning(s).\n' "$failures" "$warnings"
    exit 1
fi

if (( warnings > 0 )); then
    printf 'WARN: codex_env_doctor completed with %d warning(s).\n' "$warnings"
    exit 0
fi

printf 'PASS: codex_env_doctor completed with no failures.\n'

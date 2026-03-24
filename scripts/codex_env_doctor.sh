#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

failures=0
warnings=0
declare -a temp_files=()

cleanup() {
    local temp_file
    for temp_file in "${temp_files[@]:-}"; do
        [[ -n "$temp_file" ]] && rm -f "$temp_file"
    done
}
trap cleanup EXIT

run_check() {
    local label="$1"
    shift

    local output_file
    output_file="$(mktemp)"
    temp_files+=("$output_file")

    if "$@" >"$output_file" 2>&1; then
        printf 'PASS: %s\n' "$label"
        return
    fi

    printf 'FAIL: %s\n' "$label"
    sed 's/^/    /' <"$output_file"
    failures=$((failures + 1))
}

warn_if_missing() {
    local path="$1"
    if [[ -f "$REPO_ROOT/$path" ]]; then
        printf 'PASS: Optional key file present (%s)\n' "$path"
        return
    fi

    printf 'WARN: Optional key file missing (%s)\n' "$path"
    warnings=$((warnings + 1))
}

run_check "bootstrap_dev_environment.sh" "$REPO_ROOT/scripts/bootstrap_dev_environment.sh"
run_check "config/validate_config.py" python "$REPO_ROOT/config/validate_config.py"
run_check "config/check_runtime_secrets.py --require-env-only" python "$REPO_ROOT/config/check_runtime_secrets.py" --require-env-only
run_check \
    "config/check_runtime_env.py --context desktop_app" \
    env \
    ROBODJ_ENV=development \
    ROBODJ_STATION_ID=dgn_local \
    ROBODJ_LOG_LEVEL=INFO \
    ROBODJ_DATA_DIR=./config/cache \
    python "$REPO_ROOT/config/check_runtime_env.py" --context desktop_app

warn_if_missing "config/secret.key"
warn_if_missing "config/secret_v2.key"

exit_code=0
if ((failures > 0)); then
    printf 'FAIL: codex_env_doctor completed with %d failure(s), %d warning(s).\n' "$failures" "$warnings"
    exit_code=1
elif ((warnings > 0)); then
    printf 'WARN: codex_env_doctor completed with %d warning(s).\n' "$warnings"
else
    printf 'PASS: codex_env_doctor completed with no failures.\n'
fi

exit "$exit_code"

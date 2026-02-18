#!/usr/bin/env bash
set -euo pipefail

ci_mode=0
if [[ "${1:-}" == "--ci" ]]; then
    ci_mode=1
elif [[ $# -gt 0 ]]; then
    echo "FAIL ARGUMENT" >&2
    exit 2
fi

required_env_vars=(
    "ROBODJ_SECRET_KEY"
    "ROBODJ_SECRET_V2_KEY"
)

overall_status=0

emit() {
    local level="$1"
    local name="$2"

    if [[ "$level" == "FAIL" ]]; then
        overall_status=1
    fi

    if [[ $ci_mode -eq 1 ]]; then
        printf '%s\t%s\n' "$level" "$name"
    else
        printf '%s %s\n' "$level" "$name"
    fi
}

for var_name in "${required_env_vars[@]}"; do
    if [[ -n "${!var_name:-}" ]]; then
        emit "PASS" "$var_name"
    else
        emit "FAIL" "$var_name"
    fi
done

if python config/check_runtime_secrets.py --require-env-only >/dev/null 2>&1; then
    emit "PASS" "SECRET_INTEGRITY"
else
    emit "FAIL" "SECRET_INTEGRITY"
fi

if command -v git >/dev/null 2>&1; then
    emit "PASS" "git"
else
    emit "FAIL" "git"
fi

if command -v gh >/dev/null 2>&1; then
    emit "PASS" "gh"
else
    emit "WARN" "gh"
fi

if command -v docker >/dev/null 2>&1; then
    emit "PASS" "docker"
else
    emit "WARN" "docker"
fi

if [[ $overall_status -ne 0 ]]; then
    emit "FAIL" "ENV_DOCTOR"
    exit 1
fi

emit "PASS" "ENV_DOCTOR"

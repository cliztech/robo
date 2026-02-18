#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-automatic}"

if [[ "$MODE" != "automatic" && "$MODE" != "manual" ]]; then
    echo "[error] Invalid mode '$MODE'. Use: automatic | manual" >&2
    exit 1
fi

required_tools=(git python3 rg)
optional_tools=(docker gh node npm)

required_secret_env_vars=(
    ROBODJ_SECRET_KEY
    ROBODJ_SECRET_V2_KEY
    ICECAST_PASS
    ICECAST_SOURCE_PASSWORD
    ICECAST_ADMIN_PASSWORD
    ICECAST_RELAY_PASSWORD
)

placeholder_patterns=(
    "changeme"
    "change_me"
    "placeholder"
    "example"
    "sample"
    "dummy"
    "hackme"
    "your_"
    "todo"
    "unset"
)

errors=0
warnings=0

print_header() {
    printf '\n== %s ==\n' "$1"
}

warn() {
    echo "[warn] $1"
    warnings=$((warnings + 1))
}

fail() {
    echo "[error] $1" >&2
    errors=$((errors + 1))
}

check_tooling() {
    print_header "Tooling availability"

    for tool in "${required_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo "[ok] Required tool detected: $tool"
        else
            fail "Required tool missing: $tool"
        fi
    done

    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo "[ok] Optional tool detected: $tool"
        else
            warn "Optional tool missing: $tool"
        fi
    done
}

check_environment_mode_assumptions() {
    print_header "Environment mode assumptions ($MODE)"

    if [[ ! -d .git ]]; then
        fail "Run from repository root ('.git' not found)."
        return
    fi

    echo "[ok] Git repository detected."

    case "$MODE" in
        automatic)
            if [[ -n "${CODEX_CI:-}" ]]; then
                echo "[ok] CODEX_CI is set (${CODEX_CI})."
            else
                warn "CODEX_CI is not set in automatic mode; confirm this is a Codex-managed runtime."
            fi

            if [[ -n "${CODEX_HOME:-}" ]]; then
                echo "[ok] CODEX_HOME is set (${CODEX_HOME})."
            else
                warn "CODEX_HOME is not set in automatic mode."
            fi
            ;;
        manual)
            if [[ -n "${CODEX_CI:-}" ]]; then
                warn "CODEX_CI is set in manual mode; this usually indicates non-local execution."
            else
                echo "[ok] CODEX_CI is not set (local/manual assumption)."
            fi
            ;;
    esac
}

value_looks_placeholder() {
    local lowered
    lowered="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"

    for pattern in "${placeholder_patterns[@]}"; do
        if [[ "$lowered" == *"$pattern"* ]]; then
            return 0
        fi
    done

    return 1
}

check_secret_env_vars() {
    print_header "Secret environment variable presence"

    for secret_name in "${required_secret_env_vars[@]}"; do
        secret_value="${!secret_name:-}"

        if [[ -z "$secret_value" ]]; then
            fail "Missing required secret env var: $secret_name"
            continue
        fi

        echo "[ok] Secret env var is present: $secret_name"

        if value_looks_placeholder "$secret_value"; then
            warn "Secret env var '$secret_name' appears to use a placeholder value."
        fi
    done

    if [[ "$MODE" == "manual" ]]; then
        if [[ -f .env.local || -f radio-agentic/.env.local ]]; then
            echo "[ok] Local fallback env file detected for manual mode."
        else
            warn "No local fallback env file detected (.env.local or radio-agentic/.env.local)."
        fi
    fi
}

print_summary_and_exit() {
    print_header "Summary"

    if (( errors > 0 )); then
        echo "[result] FAIL ($errors error(s), $warnings warning(s))"
        exit 1
    fi

    echo "[result] PASS ($warnings warning(s))"
}

printf '\nRoboDJ Codex environment bootstrap\n'
check_tooling
check_environment_mode_assumptions
check_secret_env_vars
print_summary_and_exit

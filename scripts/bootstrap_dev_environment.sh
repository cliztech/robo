#!/usr/bin/env bash
set -euo pipefail

WITH_PREFLIGHT=0

for arg in "$@"; do
    case "$arg" in
        --with-preflight)
            WITH_PREFLIGHT=1
            ;;
        -h|--help)
            cat <<'EOF'
Usage: scripts/bootstrap_dev_environment.sh [--with-preflight]

Options:
  --with-preflight  Run config validation and runtime secret environment checks.
  -h, --help        Show this help message.
EOF
            exit 0
            ;;
        *)
            echo "[error] Unknown argument: $arg" >&2
            echo "       Run: scripts/bootstrap_dev_environment.sh --help" >&2
            exit 1
            ;;
    esac
done

printf '\n== RoboDJ repo environment checks ==\n'

if [[ -d .git ]]; then
    echo "[ok] Git repository detected."
else
    echo "[error] Not a git repository." >&2
    exit 1
fi

if git remote -v | grep -q .; then
    echo "[ok] Git remotes configured:"
    git remote -v
else
    echo "[warn] No git remotes configured."
    echo "       Run: scripts/setup_git_remotes.sh <owner> <repo> [upstream_owner]"
fi

if [[ -f docker-compose.yaml ]]; then
    echo "[ok] docker-compose.yaml found."
    if command -v docker >/dev/null 2>&1; then
        if docker compose version >/dev/null 2>&1; then
            echo "[ok] Docker Compose plugin available."
        else
            echo "[warn] Docker installed but 'docker compose' plugin unavailable."
        fi
    else
        echo "[warn] Docker not installed in this environment."
    fi
else
    echo "[warn] docker-compose.yaml missing."
fi

if [[ -d .github/workflows ]]; then
    echo "[ok] GitHub workflows present:"
    find .github/workflows -maxdepth 1 -type f -name '*.yml' -print | sed 's#^#       - #' 
else
    echo "[warn] .github/workflows directory missing."
fi

if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo "[ok] GitHub CLI installed and authenticated."
    else
        echo "[warn] GitHub CLI installed but not authenticated."
        echo "       Run: gh auth login"
    fi
else
    echo "[warn] GitHub CLI (gh) not found."
fi

if [[ "$WITH_PREFLIGHT" -eq 1 ]]; then
    preflight_total=0
    preflight_passed=0
    preflight_failed=0

    run_preflight_check() {
        local label="$1"
        shift

        preflight_total=$((preflight_total + 1))

        if "$@" >/dev/null 2>&1; then
            preflight_passed=$((preflight_passed + 1))
            echo "[ok] ${label}"
        else
            preflight_failed=$((preflight_failed + 1))
            echo "[error] ${label}"
            echo "       Re-run manually for details: $*"
        fi
    }

    printf '\n== Optional preflight checks ==\n'
    run_preflight_check "Config schema validation passed." python config/validate_config.py
    run_preflight_check "Runtime secret env check passed." python config/check_runtime_secrets.py --require-env-only

    echo "Preflight summary: ${preflight_passed}/${preflight_total} passed, ${preflight_failed} failed."

    if [[ "$preflight_failed" -gt 0 ]]; then
        echo "[error] One or more preflight checks failed." >&2
        exit 1
    fi
fi

printf '\nEnvironment check complete.\n'

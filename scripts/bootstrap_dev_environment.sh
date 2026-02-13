#!/usr/bin/env bash
set -euo pipefail

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

printf '\nEnvironment check complete.\n'

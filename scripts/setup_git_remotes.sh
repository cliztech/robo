#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/setup_git_remotes.sh <owner> <repo> [upstream_owner]
# or set env vars:
#   GITHUB_OWNER, GITHUB_REPO, GITHUB_UPSTREAM_OWNER

OWNER="${1:-${GITHUB_OWNER:-}}"
REPO="${2:-${GITHUB_REPO:-}}"
UPSTREAM_OWNER="${3:-${GITHUB_UPSTREAM_OWNER:-}}"

if [[ -z "$OWNER" || -z "$REPO" ]]; then
    echo "Usage: $0 <owner> <repo> [upstream_owner]"
    echo "or set GITHUB_OWNER and GITHUB_REPO environment variables."
    exit 1
fi

origin_url="git@github.com:${OWNER}/${REPO}.git"
https_origin_url="https://github.com/${OWNER}/${REPO}.git"

echo "Configuring origin remote..."
if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$origin_url"
else
    git remote add origin "$origin_url"
fi

echo "Origin set to: $origin_url"

echo "Adding HTTPS push fallback as 'origin-https'..."
if git remote get-url origin-https >/dev/null 2>&1; then
    git remote set-url origin-https "$https_origin_url"
else
    git remote add origin-https "$https_origin_url"
fi

if [[ -n "$UPSTREAM_OWNER" ]]; then
    upstream_url="git@github.com:${UPSTREAM_OWNER}/${REPO}.git"
    echo "Configuring upstream remote..."
    if git remote get-url upstream >/dev/null 2>&1; then
        git remote set-url upstream "$upstream_url"
    else
        git remote add upstream "$upstream_url"
    fi
    echo "Upstream set to: $upstream_url"
fi

echo "Fetching remote metadata..."
git fetch --all --prune

echo "Done. Current remotes:"
git remote -v

#!/usr/bin/env bash
set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

failures=0
warnings=0

run_check() {
    local label="$1"
    shift

    local output_file
    output_file=$(mktemp)
    # Ensure temp file is cleaned up when function returns
    trap "rm -f '$output_file'" RETURN

    if "$@" >"$output_file" 2>&1; then
        printf 'PASS: %s\n' "$label"
    else
        printf 'FAIL: %s\n' "$label"
        # Print the captured output to provide context on the failure.
        sed 's/^/    /' < "$output_file"
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
set -u

EXIT_CODE=0

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  EXIT_CODE=1
}

warn() {
  printf '[WARN] %s\n' "$1"
}

check_path_exists() {
  local target_path="$1"
  local description="$2"
  if [[ -e "$target_path" ]]; then
    pass "$description found at $target_path"
  else
    fail "$description missing at $target_path"
  fi
}

printf '== Codex environment doctor (read-only checks) ==\n'

# 1) Confirm repo context and expected files exist.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT="$(git rev-parse --show-toplevel)"
  pass "Git repository detected"
  printf 'Repository root: %s\n' "$REPO_ROOT"
else
  fail 'Not running inside a git repository.'
  REPO_ROOT="$(pwd)"
fi

check_path_exists "$REPO_ROOT/AGENTS.md" 'AGENTS.md'
check_path_exists "$REPO_ROOT/config/check_runtime_secrets.py" 'Runtime secret checker'
check_path_exists "$REPO_ROOT/docs/DEVELOPMENT_ENV_SETUP.md" 'Development environment setup doc'

# 2) Check presence of required environment variables.
if [[ -n "${ROBODJ_SECRET_KEY:-}" ]]; then
  pass 'ROBODJ_SECRET_KEY is set in environment'
else
  fail 'ROBODJ_SECRET_KEY is not set in environment'
fi

if [[ -n "${ROBODJ_SECRET_V2_KEY:-}" ]]; then
  pass 'ROBODJ_SECRET_V2_KEY is set in environment'
else
  fail 'ROBODJ_SECRET_V2_KEY is not set in environment'
fi

# 3) Execute runtime secret checker in env-only mode.
printf '\nRunning python config/check_runtime_secrets.py --require-env-only\n'
if (cd "$REPO_ROOT" && python config/check_runtime_secrets.py --require-env-only); then
  pass 'Runtime secret integrity check succeeded'
else
  fail 'Runtime secret integrity check failed'
fi

# 4) Print actionable remediation steps for missing/invalid variables.
if [[ "$EXIT_CODE" -ne 0 ]]; then
  printf '\nRemediation steps:\n' >&2
  printf '  1) Export ROBODJ_SECRET_KEY and ROBODJ_SECRET_V2_KEY in your current shell session.\n' >&2
  printf '     Example (Linux/macOS):\n' >&2
  printf '       export ROBODJ_SECRET_KEY="<redacted>"\n' >&2
  printf '       export ROBODJ_SECRET_V2_KEY="<redacted>"\n' >&2
  printf '  2) Verify variables are non-empty:\n' >&2
  printf '       test -n "$ROBODJ_SECRET_KEY" && test -n "$ROBODJ_SECRET_V2_KEY"\n' >&2
  printf '  3) Re-run this doctor script and confirm all checks pass.\n' >&2
  printf '  4) If failures persist, rotate/recreate key files via approved secret management process and retry.\n' >&2
else
  warn 'All checks passed. No remediation required.'
fi

# 5) Exit non-zero on failed checks.
exit "$EXIT_CODE"

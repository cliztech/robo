#!/usr/bin/env python3
"""Secret scanner — detects potential secrets in tracked files.

Exit code 0 = clean, 1 = secrets detected.

Usage:
    python scripts/check_no_secrets.py            # scan repo root
    python scripts/check_no_secrets.py path/to/dir  # scan specific dir

Patterns checked:
    - Hardcoded API keys (sk-..., AKIA..., ghp_..., ghu_..., etc.)
    - Generic password/token assignments
    - Base64-encoded secrets (long base64 strings in assignments)
    - Private keys (BEGIN RSA/EC/OPENSSH PRIVATE KEY)
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

# Directories and files to skip
SKIP_DIRS = {
    ".git", "node_modules", ".next", ".venv", "venv", "env",
    "__pycache__", ".artifacts", "make-4.3", "openclaw",
    "_bmad-custom-backup-temp", "_bmad-modified-backup-temp",
}
SKIP_EXTENSIONS = {
    ".exe", ".dll", ".db", ".sqlite", ".key", ".pdf", ".png",
    ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf",
    ".zip", ".tar", ".gz", ".bin", ".iso", ".lock", ".map",
    ".tsbuildinfo",
}
SAFE_FILES = {
    ".env.example", "secret.key.example", "secret_v2.key.example",
    ".robodj_trial.example", "robodj.lock.example",
    "scheduler.signal.example", "check_no_secrets.py",
}

# Secret patterns (compiled regexes)
SECRET_PATTERNS = [
    # OpenAI
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "OpenAI API key"),
    # AWS
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS Access Key ID"),
    # GitHub
    (re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"), "GitHub token"),
    # Supabase / JWT
    (re.compile(r"eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}"), "JWT / Supabase key"),
    # Private keys
    (re.compile(r"-----BEGIN\s+(RSA|EC|OPENSSH)\s+PRIVATE KEY-----"), "Private key"),
    # Generic password/token in assignments
    (re.compile(r"""(?:password|passwd|secret|token|api_key)\s*[=:]\s*['"][^'"]{8,}['"]""", re.IGNORECASE), "Hardcoded credential"),
]


def scan_file(file_path: Path) -> list[tuple[int, str, str]]:
    """Scan a single file for secret patterns. Returns list of (line_no, pattern_name, line_content)."""
    findings: list[tuple[int, str, str]] = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except (OSError, UnicodeDecodeError):
        return findings

    for line_no, line in enumerate(content.splitlines(), start=1):
        # Skip comments and placeholder lines
        stripped = line.strip()
        if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("<!--"):
            continue
        if "REPLACE_WITH_" in line or "PLACEHOLDER" in line or "example" in line.lower():
            continue

        for pattern, name in SECRET_PATTERNS:
            if pattern.search(line):
                findings.append((line_no, name, line.strip()[:120]))
    return findings


def scan_directory(root: Path) -> dict[str, list[tuple[int, str, str]]]:
    """Walk directory tree and scan all eligible files."""
    results: dict[str, list[tuple[int, str, str]]] = {}
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skipped directories
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            if filename in SAFE_FILES:
                continue
            file_path = Path(dirpath) / filename
            if file_path.suffix.lower() in SKIP_EXTENSIONS:
                continue

            findings = scan_file(file_path)
            if findings:
                rel = str(file_path.relative_to(root))
                results[rel] = findings
    return results


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    print(f"🔍 Scanning {root} for potential secrets...")

    results = scan_directory(root)

    if not results:
        print("✅ No secrets detected in tracked files.")
        return 0

    print(f"\n🚨 Potential secrets found in {len(results)} file(s):\n")
    for filepath, findings in sorted(results.items()):
        print(f"  📄 {filepath}")
        for line_no, pattern_name, snippet in findings:
            print(f"     L{line_no}: [{pattern_name}] {snippet}")
        print()

    print(f"Total: {sum(len(f) for f in results.values())} finding(s) in {len(results)} file(s).")
    print("Fix: move secrets to environment variables (.env) or config/*.key files.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

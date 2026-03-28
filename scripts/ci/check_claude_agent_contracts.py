#!/usr/bin/env python3
"""Validate `.claude/agents` role files against required frontmatter contract."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_AGENTS_ROOT = ROOT / ".claude" / "agents"

REQUIRED_KEYS = {
    "role",
    "owner_team",
    "route",
    "allowed_changes",
    "required_checks",
    "handoff_to",
    "completion_gate",
}
ALLOWED_ROUTES = {"QA", "Change", "Proposal"}
LIST_KEYS = {"allowed_changes", "required_checks", "handoff_to"}


@dataclass
class ValidationIssue:
    path: Path
    message: str


def _extract_frontmatter(markdown: str) -> str | None:
    match = re.match(r"^---\n(.*?)\n---\n", markdown, re.DOTALL)
    if not match:
        return None
    return match.group(1)


def _parse_frontmatter(frontmatter_text: str) -> tuple[dict[str, object], list[str]]:
    """Parses the YAML frontmatter text using a standard library."""
    try:
        # Using a standard YAML parser is more robust than manual parsing.
        # This handles various YAML features, comments, and edge cases.
        data = yaml.safe_load(frontmatter_text)
        if not isinstance(data, dict):
            return {}, [f"Frontmatter is not a dictionary, but a {type(data).__name__}"]
        return data, []
    except yaml.YAMLError as e:
        # Catches parsing errors, including syntax issues.
        return {}, [f"YAML parsing error: {e}"]


def _validate_role_file(path: Path, rel: Path, roles_seen: set[str]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    content = path.read_text(encoding="utf-8")
    frontmatter_block = _extract_frontmatter(content)

    if frontmatter_block is None:
        return [ValidationIssue(rel, "missing or invalid YAML frontmatter")]

    frontmatter, parse_issues = _parse_frontmatter(frontmatter_block)
    for item in parse_issues:
        issues.append(ValidationIssue(rel, f"frontmatter parse issue: {item}"))

    unknown = sorted(set(frontmatter.keys()) - REQUIRED_KEYS)
    if unknown:
        issues.append(ValidationIssue(rel, f"unknown keys: {', '.join(unknown)}"))

    missing = sorted(REQUIRED_KEYS - set(frontmatter.keys()))
    if missing:
        issues.append(ValidationIssue(rel, f"missing keys: {', '.join(missing)}"))

    role = frontmatter.get("role")
    if isinstance(role, str) and role:
        if role in roles_seen:
            issues.append(ValidationIssue(rel, f"duplicate role id: {role}"))
        roles_seen.add(role)
    else:
        issues.append(ValidationIssue(rel, "role must be a non-empty string"))

    route = frontmatter.get("route")
    if route not in ALLOWED_ROUTES:
        issues.append(
            ValidationIssue(
                rel,
                f"route must be one of {sorted(ALLOWED_ROUTES)} (got: {route!r})",
            )
        )

    for list_key in LIST_KEYS:
        value = frontmatter.get(list_key)
        if not isinstance(value, list) or not value:
            issues.append(ValidationIssue(rel, f"{list_key} must be a non-empty list"))

    completion_gate = frontmatter.get("completion_gate")
    if not isinstance(completion_gate, str) or not completion_gate.strip():
        issues.append(ValidationIssue(rel, "completion_gate must be a non-empty string"))

    return issues


def run(agents_root: Path, fail_on_skip: bool = False) -> int:
    if not agents_root.exists():
        print(f"SKIP: {agents_root} not present in repository checkout.")
        return 1 if fail_on_skip else 0

    role_files = sorted(p for p in agents_root.rglob("*.md") if p.name.lower() != "readme.md")
    if not role_files:
        print(f"SKIP: no role markdown files found under {agents_root}.")
        return 1 if fail_on_skip else 0

    issues: list[ValidationIssue] = []
    roles_seen: set[str] = set()

    for path in role_files:
        rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        issues.extend(_validate_role_file(path, rel, roles_seen))

    if issues:
        print("FAIL: .claude/agents contract validation failed")
        for issue in issues:
            print(f" - {issue.path}: {issue.message}")
        return 1

    print(f"PASS: validated {len(role_files)} role file(s) under {agents_root}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--agents-root",
        type=Path,
        default=DEFAULT_AGENTS_ROOT,
        help="Path to agents directory (default: .claude/agents)",
    )
    parser.add_argument(
        "--fail-on-skip",
        action="store_true",
        help="Return non-zero when agents directory or role files are missing.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return run(args.agents_root, fail_on_skip=args.fail_on_skip)


if __name__ == "__main__":
    raise SystemExit(main())

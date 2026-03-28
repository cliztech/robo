from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPT = Path("scripts/ci/check_claude_agent_contracts.py")


def _run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        check=False,
        capture_output=True,
        text=True,
    )


def test_pass_with_valid_role_file(tmp_path: Path) -> None:
    agents = tmp_path / "agents"
    eng = agents / "engineering"
    eng.mkdir(parents=True)
    (eng / "planner.md").write_text(
        """---
role: planner
owner_team: engineering
route: Change
allowed_changes:
  - docs
required_checks:
  - lint
handoff_to:
  - engineering/verifier
completion_gate: done
---
# Planner
""",
        encoding="utf-8",
    )

    result = _run("--agents-root", str(agents))
    assert result.returncode == 0, result.stdout + result.stderr
    assert "PASS: validated 1 role file(s)" in result.stdout


def test_fail_on_duplicate_role_ids(tmp_path: Path) -> None:
    agents = tmp_path / "agents"
    (agents / "a").mkdir(parents=True)
    (agents / "b").mkdir(parents=True)

    payload = """---
role: duplicate
owner_team: engineering
route: QA
allowed_changes:
  - docs
required_checks:
  - lint
handoff_to:
  - handoff
completion_gate: done
---
"""
    (agents / "a" / "one.md").write_text(payload, encoding="utf-8")
    (agents / "b" / "two.md").write_text(payload, encoding="utf-8")

    result = _run("--agents-root", str(agents))
    assert result.returncode == 1
    assert "duplicate role id: duplicate" in result.stdout


def test_fail_on_skip_flag(tmp_path: Path) -> None:
    result = _run("--agents-root", str(tmp_path / "missing"), "--fail-on-skip")
    assert result.returncode == 1
    assert "SKIP:" in result.stdout

#!/usr/bin/env python3
"""Builds a milestone report from config/massive_workflow_program.json."""

import argparse
import json
from pathlib import Path


def build_report(program: dict) -> str:
    lines = []
    lines.append(f"Program: {program['program_name']} (v{program['version']})")
    lines.append("")
    lines.append("Targets:")
    for key, value in program.get("targets", {}).items():
        lines.append(f"- {key}: {value}")

    lines.append("")
    profiles = ", ".join(program.get("execution_profiles", []))
    lines.append(f"Execution profiles: {profiles}")
    lines.append("")
    lines.append("Workstreams:")

    for workstream in program.get("workstreams", []):
        lines.append(f"- [{workstream['id']}] {workstream['name']}")
        for phase in workstream.get("phases", []):
            lines.append(f"  - ({phase['id']}) {phase['name']}")
            for milestone in phase.get("milestones", []):
                lines.append(f"    - {milestone}")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate workflow milestone report")
    parser.add_argument(
        "--program",
        default="config/massive_workflow_program.json",
        help="Path to workflow program JSON"
    )
    parser.add_argument(
        "--out",
        default="config/massive_workflow_report.txt",
        help="Output report path"
    )
    args = parser.parse_args()

    program_path = Path(args.program)
    out_path = Path(args.out)

    with program_path.open("r", encoding="utf-8") as f:
        program = json.load(f)

    report = build_report(program)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        f.write(report)

    print(f"Wrote report to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

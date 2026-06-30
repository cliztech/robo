from __future__ import annotations

import json
import shlex
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "config" / "schemas" / "release_gates.json"


def run_gate(command: str, artifact_path: Path) -> dict[str, object]:
    started_at = time.time()
    try:
        process = subprocess.run(
            shlex.split(command),
            cwd=ROOT,
            shell=False,
            text=True,
            capture_output=True,
            check=False,
        )
        returncode = process.returncode
        stdout = process.stdout
        stderr = process.stderr
    except FileNotFoundError as e:
        returncode = 127
        stdout = ""
        stderr = f"Command not found: {e}"

    duration = round(time.time() - started_at, 2)
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_path.write_text(
        (
            f"$ {command}\n"
            f"exit_code={returncode}\n"
            f"duration_seconds={duration}\n\n"
            "--- stdout ---\n"
            f"{stdout}\n"
            "--- stderr ---\n"
            f"{stderr}\n"
        ),
        encoding="utf-8",
    )

    return {
        "command": command,
        "artifact": str(artifact_path.relative_to(ROOT)),
        "exit_code": returncode,
        "duration_seconds": duration,
        "status": "pass" if returncode == 0 else "fail",
    }


def main() -> int:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    report_cfg = config["report"]
    results: list[dict[str, object]] = []

    for gate in config["required_checks"]:
        artifact = ROOT / gate["artifact"]
        gate_result = run_gate(gate["command"], artifact)
        gate_result["id"] = gate["id"]
        gate_result["name"] = gate["name"]
        results.append(gate_result)

    overall_status = "ready" if all(r["status"] == "pass" for r in results) else "blocked"

    json_report_path = ROOT / report_cfg["json"]
    markdown_report_path = ROOT / report_cfg["markdown"]
    json_report_path.parent.mkdir(parents=True, exist_ok=True)

    report = {
        "status": overall_status,
        "generated_at_epoch": int(time.time()),
        "checks": results,
    }
    json_report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Release Readiness Report",
        "",
        f"Overall status: **{overall_status.upper()}**",
        "",
        "| Check | Status | Exit Code | Duration (s) | Artifact |",
        "|---|---|---:|---:|---|",
    ]
    for item in results:
        icon = "✅" if item["status"] == "pass" else "❌"
        lines.append(
            f"| {item['name']} | {icon} {item['status']} | {item['exit_code']} | {item['duration_seconds']} | `{item['artifact']}` |"
        )

    markdown_report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return 0 if overall_status == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())

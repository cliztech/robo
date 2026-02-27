from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REQUIRED_AUDIT_FIELDS = (
    "event_id",
    "timestamp",
    "action",
    "actor_id",
    "result",
    "before_sha256",
    "after_sha256",
    "approvals",
)


@dataclass(frozen=True)
class AuditExportResult:
    batch_id: str
    export_path: Path
    manifest_path: Path
    digest_sha256: str
    record_count: int


def stable_sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _validate_record(record: dict[str, Any]) -> None:
    missing = [field for field in REQUIRED_AUDIT_FIELDS if field not in record]
    if missing:
        raise ValueError(f"Audit record missing required fields: {missing}")


def append_audit_record(log_path: Path, record: dict[str, Any]) -> dict[str, Any]:
    _validate_record(record)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    serialized = json.dumps(record, sort_keys=True, separators=(",", ":"))
    immutable_record = dict(record)
    immutable_record["record_sha256"] = stable_sha256(serialized)

    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(immutable_record, sort_keys=True) + "\n")

    return immutable_record


def export_audit_batch(
    *,
    source_log_path: Path,
    batch_id: str,
    export_root: Path = Path("artifacts/security/audit_exports"),
    export_date: datetime | None = None,
) -> AuditExportResult:
    if not source_log_path.exists():
        raise FileNotFoundError(f"Audit source log not found: {source_log_path}")

    run_date = (export_date or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
    out_dir = export_root / run_date
    out_dir.mkdir(parents=True, exist_ok=True)

    export_path = out_dir / f"{batch_id}.ndjson"
    manifest_path = out_dir / f"{batch_id}.sha256"

    lines = source_log_path.read_text(encoding="utf-8").splitlines()
    valid_lines: list[str] = []
    for line in lines:
        if not line.strip():
            continue
        record = json.loads(line)
        _validate_record(record)
        valid_lines.append(json.dumps(record, sort_keys=True))

    export_payload = "\n".join(valid_lines)
    if export_payload:
        export_payload += "\n"
    export_path.write_text(export_payload, encoding="utf-8")

    digest = file_sha256(export_path)
    manifest_path.write_text(f"{digest}  {export_path.name}\n", encoding="utf-8")

    return AuditExportResult(
        batch_id=batch_id,
        export_path=export_path,
        manifest_path=manifest_path,
        digest_sha256=digest,
        record_count=len(valid_lines),
    )

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
from typing import Iterable, Mapping, Sequence
from uuid import uuid4
import string


def deterministic_sha256(payload: Mapping[str, object]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _sanitize_batch_id(raw: str) -> str:
    """
    Sanitize a batch ID so it is safe to use as a filename component.

    Only ASCII letters, digits, hyphen and underscore are allowed; all other
    characters are replaced with '_'. If the result is empty, generate a
    fresh UUID4 hex string.
    """
    allowed = set(string.ascii_letters + string.digits + "-_")
    sanitized = "".join(ch if ch in allowed else "_" for ch in raw)
    if not sanitized:
        sanitized = uuid4().hex
    return sanitized


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
    export_dir: Path
    ndjson_path: Path
    sha256_path: Path
    manifest_path: Path
    line_count: int
    digest_sha256: str


def export_audit_events_ndjson(
    events: Sequence[Mapping[str, object]],
    *,
    export_root: Path = Path("artifacts/security/audit_exports"),
    now_utc: datetime | None = None,
    batch_id: str | None = None,
) -> AuditExportResult:
    timestamp = now_utc or datetime.now(timezone.utc)
    day_dir = export_root / timestamp.strftime("%Y-%m-%d")
    day_dir.mkdir(parents=True, exist_ok=True)

    resolved_batch_id = batch_id or uuid4().hex
    safe_batch_id = _sanitize_batch_id(resolved_batch_id)
    ndjson_path = day_dir / f"{safe_batch_id}.ndjson"
    sha256_path = day_dir / f"{safe_batch_id}.sha256"
    manifest_path = day_dir / f"{safe_batch_id}.manifest.json"

    lines = [json.dumps(event, sort_keys=True, separators=(",", ":"), ensure_ascii=False) for event in events]
    ndjson_payload = "\n".join(lines)
    if lines:
        ndjson_payload += "\n"

    ndjson_path.write_text(ndjson_payload, encoding="utf-8")
    digest = hashlib.sha256(ndjson_payload.encode("utf-8")).hexdigest()
    sha256_path.write_text(f"{digest}  {ndjson_path.name}\n", encoding="utf-8")

    manifest = {
        "batch_id": safe_batch_id,
        "date_utc": timestamp.strftime("%Y-%m-%d"),
        "line_count": len(lines),
        "ndjson_file": ndjson_path.name,
        "sha256_file": sha256_path.name,
        "digest_sha256": digest,
        "export_ts_utc": timestamp.isoformat(),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    return AuditExportResult(
        batch_id=safe_batch_id,
        export_dir=day_dir,
        ndjson_path=ndjson_path,
        sha256_path=sha256_path,
        manifest_path=manifest_path,
        line_count=len(lines),
        digest_sha256=digest,
    )


def read_ndjson(path: Path) -> list[dict[str, object]]:
    if not path.exists():
        return []
    rows: list[dict[str, object]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        rows.append(json.loads(line))
    return rows

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
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

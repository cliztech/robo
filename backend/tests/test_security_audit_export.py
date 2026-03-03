from __future__ import annotations

import json

from backend.security.audit_export import append_audit_record, export_audit_batch


def test_append_audit_record_adds_immutable_digest(tmp_path):
    log_path = tmp_path / "security_audit.ndjson"
    record = {
        "event_id": "evt-1",
        "timestamp": "2026-02-27T00:00:00+00:00",
        "action": "ACT-PUBLISH",
        "actor_id": "operator-1",
        "result": "success",
        "before_sha256": "0" * 64,
        "after_sha256": "1" * 64,
        "approvals": [{"approver_id": "admin-1", "approver_roles": ["admin"], "reason": "ok"}],
    }

    immutable = append_audit_record(log_path, record)

    assert "record_sha256" in immutable
    stored = json.loads(log_path.read_text(encoding="utf-8").strip())
    assert stored["record_sha256"] == immutable["record_sha256"]


def test_export_audit_batch_writes_manifest(tmp_path):
    source = tmp_path / "security_audit.ndjson"
    append_audit_record(
        source,
        {
            "event_id": "evt-2",
            "timestamp": "2026-02-27T00:00:00+00:00",
            "action": "ACT-UPDATE-SCHEDULES",
            "actor_id": "operator-1",
            "result": "success",
            "before_sha256": "2" * 64,
            "after_sha256": "3" * 64,
            "approvals": [],
        },
    )

    result = export_audit_batch(source_log_path=source, batch_id="batch-1", export_root=tmp_path / "exports")

    assert result.export_path.exists()
    assert result.manifest_path.exists()
    manifest = result.manifest_path.read_text(encoding="utf-8")
    assert result.digest_sha256 in manifest

import json
from datetime import datetime, timezone

from backend.security.approval_policy import (
    ActionId,
    ApproverRole,
    ApprovalRecord,
    evaluate_approval_chain,
    parse_approval_chain,
)
from backend.security.audit_export import deterministic_sha256, export_audit_events_ndjson, read_ndjson


def test_approval_policy_role_matching() -> None:
    chain = [
        ApprovalRecord(principal="alice", role=ApproverRole.OPERATOR, approved_at_utc="2026-01-01T00:00:00Z"),
        ApprovalRecord(principal="bob", role=ApproverRole.PRODUCER, approved_at_utc="2026-01-01T00:00:00Z"),
    ]
    allowed = evaluate_approval_chain(ActionId.ACT_PUBLISH, chain)
    denied = evaluate_approval_chain(ActionId.ACT_KEY_ROTATION, chain)

    assert allowed.allowed is True
    assert denied.allowed is False
    assert "security" in denied.reason


def test_parse_chain_and_hash_are_deterministic() -> None:
    raw = json.dumps(
        [
            {"principal": "alice", "role": "admin", "approved_at_utc": "2026-01-01T00:00:00Z"},
            {"principal": "bob", "role": "producer", "approved_at_utc": "2026-01-01T00:01:00Z"},
        ]
    )
    parsed = parse_approval_chain(raw)
    payload_a = {"b": 2, "a": 1}
    payload_b = {"a": 1, "b": 2}

    assert len(parsed) == 2
    assert deterministic_sha256(payload_a) == deterministic_sha256(payload_b)


def test_audit_export_integrity_artifacts(tmp_path) -> None:
    events = [
        {
            "event_id": "evt-1",
            "action_id": "ACT-CONFIG-EDIT",
            "actor_principal": "alice",
            "target_ref": "config/autonomy_policy.json",
            "before_hash_sha256": "a" * 64,
            "after_hash_sha256": "b" * 64,
            "approval_chain": [{"principal": "alice", "role": "admin", "approved_at_utc": "2026-01-01T00:00:00Z"}],
            "decision": "approved",
            "event_ts_utc": "2026-01-01T00:00:00Z",
            "export_batch_id": None,
        }
    ]
    result = export_audit_events_ndjson(
        events,
        export_root=tmp_path,
        batch_id="batch-1",
        now_utc=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )

    assert result.ndjson_path.exists()
    assert result.sha256_path.exists()
    assert result.manifest_path.exists()
    assert result.line_count == 1

    loaded_events = read_ndjson(result.ndjson_path)
    manifest = json.loads(result.manifest_path.read_text(encoding="utf-8"))
    checksum_line = result.sha256_path.read_text(encoding="utf-8").strip()

    assert loaded_events[0]["event_id"] == "evt-1"
    assert manifest["line_count"] == 1
    assert manifest["batch_id"] == "batch-1"
    assert checksum_line.startswith(result.digest_sha256)

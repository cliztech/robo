import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DB = SCRIPT_DIR / "telemetry.db"
DEFAULT_SCHEMA = SCRIPT_DIR / "schema.sql"
VALID_LEVELS = {"debug", "info", "warning", "error", "critical"}
SCHEDULER_EVENT_REQUIRED_METADATA: Dict[str, Tuple[str, ...]] = {
    "scheduler.startup_validation.succeeded": ("validation_target", "validation_stage", "duration_ms"),
    "scheduler.startup_validation.failed": ("validation_target", "validation_stage", "duration_ms"),
    "scheduler.schedule_parse.failed": ("schedule_path", "error_type", "error_excerpt"),
    "scheduler.backup.created": ("backup_path", "source_path", "backup_size_bytes"),
    "scheduler.backup.restored": ("backup_path", "restore_target", "initiator"),
    "scheduler.crash_recovery.activated": ("trigger", "recovery_plan", "last_known_checkpoint"),
}


def db_connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path, schema_path: Path) -> None:
    schema_sql = schema_path.read_text(encoding="utf-8")
    with db_connect(db_path) as conn:
        conn.executescript(schema_sql)
        conn.commit()


def insert_playout_decision(db_path: Path, payload: Dict[str, Any]) -> int:
    sql = """
    INSERT INTO playout_decisions (
        decision_ts,
        slot_start_ts,
        daypart,
        decision_inputs_json,
        selected_rule_path,
        selected_item_id,
        ai_confidence,
        fallback_used,
        decision_latency_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    with db_connect(db_path) as conn:
        cursor = conn.execute(
            sql,
            (
                payload["decision_ts"],
                payload.get("slot_start_ts"),
                payload.get("daypart"),
                json.dumps(payload.get("decision_inputs", {}), ensure_ascii=False),
                payload["selected_rule_path"],
                payload.get("selected_item_id"),
                payload.get("ai_confidence"),
                int(payload.get("fallback_used", False)),
                payload.get("decision_latency_ms"),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def insert_system_event(db_path: Path, payload: Dict[str, Any]) -> int:
    normalized_level = normalize_level(payload.get("severity", "info"))
    metadata = build_event_metadata(payload, normalized_level)
    validate_scheduler_event_payload(payload["event_type"], metadata)

    sql = """
    INSERT INTO system_events (
        event_ts,
        event_type,
        severity,
        metadata_json
    ) VALUES (?, ?, ?, ?)
    """
    with db_connect(db_path) as conn:
        cursor = conn.execute(
            sql,
            (
                payload["event_ts"],
                payload["event_type"],
                normalized_level,
                json.dumps(metadata, ensure_ascii=False),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def normalize_level(raw_level: str) -> str:
    level = (raw_level or "info").strip().lower()
    if level not in VALID_LEVELS:
        valid_levels = ", ".join(sorted(VALID_LEVELS))
        raise ValueError(f"Invalid severity/level '{raw_level}'. Use one of: {valid_levels}")
    return level


def build_event_metadata(payload: Dict[str, Any], level: str) -> Dict[str, Any]:
    metadata = dict(payload.get("metadata", {}))
    metadata["event_name"] = payload["event_type"]
    metadata["event_version"] = payload["event_version"]
    metadata["component"] = payload["component"]
    metadata["message"] = payload["message"]
    metadata["level"] = level
    if payload.get("correlation_id"):
        metadata["correlation_id"] = payload["correlation_id"]
    return metadata


def validate_scheduler_event_payload(event_type: str, metadata: Dict[str, Any]) -> None:
    if not event_type.startswith("scheduler."):
        return

    required_envelope_fields = ("event_name", "event_version", "component", "message", "level")
    missing_envelope = [field for field in required_envelope_fields if not metadata.get(field)]
    if missing_envelope:
        raise ValueError(
            "Scheduler events require fields in metadata: " + ", ".join(missing_envelope)
        )

    required_metadata = SCHEDULER_EVENT_REQUIRED_METADATA.get(event_type, ())
    missing_context = [field for field in required_metadata if field not in metadata]
    if missing_context:
        raise ValueError(
            f"Scheduler event '{event_type}' is missing required metadata keys: "
            + ", ".join(missing_context)
        )


def insert_transition_score(db_path: Path, payload: Dict[str, Any]) -> int:
    sql = """
    INSERT INTO transition_scores (
        scored_ts,
        from_item_id,
        to_item_id,
        daypart,
        quality_score,
        scorer
    ) VALUES (?, ?, ?, ?, ?, ?)
    """
    with db_connect(db_path) as conn:
        cursor = conn.execute(
            sql,
            (
                payload["scored_ts"],
                payload.get("from_item_id"),
                payload.get("to_item_id"),
                payload.get("daypart"),
                payload["quality_score"],
                payload.get("scorer", "system"),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def insert_script_outcome(db_path: Path, payload: Dict[str, Any]) -> int:
    sql = """
    INSERT INTO script_outcomes (
        outcome_ts,
        script_id,
        prompt_type,
        status,
        rejection_reason,
        latency_ms
    ) VALUES (?, ?, ?, ?, ?, ?)
    """
    with db_connect(db_path) as conn:
        cursor = conn.execute(
            sql,
            (
                payload["outcome_ts"],
                payload.get("script_id"),
                payload.get("prompt_type"),
                payload["status"],
                payload.get("rejection_reason"),
                payload.get("latency_ms"),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def insert_ad_delivery(db_path: Path, payload: Dict[str, Any]) -> int:
    sql = """
    INSERT INTO ad_delivery (
        delivery_ts,
        ad_break_id,
        ad_id,
        scheduled_count,
        delivered_count,
        status
    ) VALUES (?, ?, ?, ?, ?, ?)
    """
    with db_connect(db_path) as conn:
        cursor = conn.execute(
            sql,
            (
                payload["delivery_ts"],
                payload.get("ad_break_id"),
                payload.get("ad_id"),
                payload.get("scheduled_count"),
                payload.get("delivered_count"),
                payload.get("status"),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def fetch_rows(conn: sqlite3.Connection, query: str, params: Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
    cursor = conn.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]


def dashboard_snapshot(db_path: Path) -> Dict[str, List[Dict[str, Any]]]:
    views = {
        "live_queue_health": "SELECT * FROM live_queue_health",
        "ai_confidence_trend": "SELECT * FROM ai_confidence_trend LIMIT 120",
        "persona_activity": "SELECT * FROM persona_activity ORDER BY day DESC LIMIT 200",
        "ad_delivery_completion": "SELECT * FROM ad_delivery_completion ORDER BY day DESC LIMIT 90",
    }
    with db_connect(db_path) as conn:
        return {name: fetch_rows(conn, sql) for name, sql in views.items()}


def timeline_at_minute(db_path: Path, minute_ts: str, window_minutes: int = 1) -> Dict[str, List[Dict[str, Any]]]:
    window_mod = f"{window_minutes} minutes"
    with db_connect(db_path) as conn:
        decisions = fetch_rows(
            conn,
            """
            SELECT *
            FROM playout_decisions
            WHERE decision_ts BETWEEN datetime(?, '-' || ?) AND datetime(?, '+' || ?)
            ORDER BY decision_ts
            """,
            (minute_ts, window_mod, minute_ts, window_mod),
        )
        events = fetch_rows(
            conn,
            """
            SELECT *
            FROM system_events
            WHERE event_ts BETWEEN datetime(?, '-' || ?) AND datetime(?, '+' || ?)
            ORDER BY event_ts
            """,
            (minute_ts, window_mod, minute_ts, window_mod),
        )
        transitions = fetch_rows(
            conn,
            """
            SELECT *
            FROM transition_scores
            WHERE scored_ts BETWEEN datetime(?, '-' || ?) AND datetime(?, '+' || ?)
            ORDER BY scored_ts
            """,
            (minute_ts, window_mod, minute_ts, window_mod),
        )
    return {
        "playout_decisions": decisions,
        "system_events": events,
        "transition_scores": transitions,
    }


def metrics_snapshot(db_path: Path, day: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    with db_connect(db_path) as conn:
        filters = ""
        params: Tuple[Any, ...] = ()
        if day:
            filters = " WHERE day = ?"
            params = (day,)
        data = {
            "metrics_daily": fetch_rows(conn, f"SELECT * FROM metrics_daily{filters}", params),
            "dead_air_daily": fetch_rows(conn, f"SELECT * FROM dead_air_daily{filters}", params),
            "script_rejection_daily": fetch_rows(conn, f"SELECT * FROM script_rejection_daily{filters}", params),
            "transition_quality_daily": fetch_rows(conn, f"SELECT * FROM transition_quality_daily{filters}", params),
            "repetition_score_daily": fetch_rows(conn, f"SELECT * FROM repetition_score_daily{filters}", params),
        }
        return data


def print_json(payload: Any) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False))


def parse_json_argument(raw: str) -> Dict[str, Any]:
    return json.loads(raw) if raw else {}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="RoboDJ telemetry store utilities")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="Path to telemetry SQLite db")

    sub = parser.add_subparsers(dest="command", required=True)

    init_p = sub.add_parser("init-db", help="Initialize schema")
    init_p.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)

    decision_p = sub.add_parser("log-decision", help="Log playout decision")
    decision_p.add_argument("--decision-ts", required=True)
    decision_p.add_argument("--slot-start-ts")
    decision_p.add_argument("--daypart")
    decision_p.add_argument("--inputs-json", required=True)
    decision_p.add_argument("--selected-rule-path", required=True)
    decision_p.add_argument("--selected-item-id")
    decision_p.add_argument("--ai-confidence", type=float)
    decision_p.add_argument("--fallback-used", action="store_true")
    decision_p.add_argument("--decision-latency-ms", type=int)

    event_p = sub.add_parser("log-event", help="Log system event")
    event_p.add_argument("--event-ts", required=True)
    event_p.add_argument("--event-type", required=True)
    event_p.add_argument("--severity", default="info")
    event_p.add_argument("--event-version", default="v1")
    event_p.add_argument("--component", default="config.scripts.instrumentation")
    event_p.add_argument("--correlation-id")
    event_p.add_argument("--message", required=True)
    event_p.add_argument("--metadata-json", default="{}")

    transition_p = sub.add_parser("log-transition", help="Log transition quality")
    transition_p.add_argument("--scored-ts", required=True)
    transition_p.add_argument("--from-item-id")
    transition_p.add_argument("--to-item-id")
    transition_p.add_argument("--daypart")
    transition_p.add_argument("--quality-score", required=True, type=float)
    transition_p.add_argument("--scorer", default="system")

    script_p = sub.add_parser("log-script-outcome", help="Log script acceptance/rejection")
    script_p.add_argument("--outcome-ts", required=True)
    script_p.add_argument("--script-id")
    script_p.add_argument("--prompt-type")
    script_p.add_argument("--status", required=True, choices=["accepted", "rejected"])
    script_p.add_argument("--rejection-reason")
    script_p.add_argument("--latency-ms", type=int)

    ad_p = sub.add_parser("log-ad-delivery", help="Log ad delivery outcome")
    ad_p.add_argument("--delivery-ts", required=True)
    ad_p.add_argument("--ad-break-id")
    ad_p.add_argument("--ad-id")
    ad_p.add_argument("--scheduled-count", type=int)
    ad_p.add_argument("--delivered-count", type=int)
    ad_p.add_argument("--status")

    metrics_p = sub.add_parser("metrics", help="Query computed metrics")
    metrics_p.add_argument("--day", help="Filter day YYYY-MM-DD")

    sub.add_parser("dashboard", help="Dump dashboard view payload")

    timeline_p = sub.add_parser("timeline", help="Search what happened near minute X")
    timeline_p.add_argument("--minute-ts", required=True, help="Minute timestamp in sqlite datetime format")
    timeline_p.add_argument("--window-minutes", type=int, default=1)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "init-db":
        init_db(args.db, args.schema)
        print_json({"status": "ok", "db": str(args.db), "schema": str(args.schema)})
        return

    if args.command == "log-decision":
        row_id = insert_playout_decision(
            args.db,
            {
                "decision_ts": args.decision_ts,
                "slot_start_ts": args.slot_start_ts,
                "daypart": args.daypart,
                "decision_inputs": parse_json_argument(args.inputs_json),
                "selected_rule_path": args.selected_rule_path,
                "selected_item_id": args.selected_item_id,
                "ai_confidence": args.ai_confidence,
                "fallback_used": args.fallback_used,
                "decision_latency_ms": args.decision_latency_ms,
            },
        )
        print_json({"inserted_id": row_id})
        return

    if args.command == "log-event":
        row_id = insert_system_event(
            args.db,
            {
                "event_ts": args.event_ts,
                "event_type": args.event_type,
                "severity": args.severity,
                "event_version": args.event_version,
                "component": args.component,
                "correlation_id": args.correlation_id,
                "message": args.message,
                "metadata": parse_json_argument(args.metadata_json),
            },
        )
        print_json({"inserted_id": row_id})
        return

    if args.command == "log-transition":
        row_id = insert_transition_score(
            args.db,
            {
                "scored_ts": args.scored_ts,
                "from_item_id": args.from_item_id,
                "to_item_id": args.to_item_id,
                "daypart": args.daypart,
                "quality_score": args.quality_score,
                "scorer": args.scorer,
            },
        )
        print_json({"inserted_id": row_id})
        return

    if args.command == "log-script-outcome":
        row_id = insert_script_outcome(
            args.db,
            {
                "outcome_ts": args.outcome_ts,
                "script_id": args.script_id,
                "prompt_type": args.prompt_type,
                "status": args.status,
                "rejection_reason": args.rejection_reason,
                "latency_ms": args.latency_ms,
            },
        )
        print_json({"inserted_id": row_id})
        return

    if args.command == "log-ad-delivery":
        row_id = insert_ad_delivery(
            args.db,
            {
                "delivery_ts": args.delivery_ts,
                "ad_break_id": args.ad_break_id,
                "ad_id": args.ad_id,
                "scheduled_count": args.scheduled_count,
                "delivered_count": args.delivered_count,
                "status": args.status,
            },
        )
        print_json({"inserted_id": row_id})
        return

    if args.command == "dashboard":
        print_json(dashboard_snapshot(args.db))
        return

    if args.command == "timeline":
        print_json(timeline_at_minute(args.db, args.minute_ts, args.window_minutes))
        return

    if args.command == "metrics":
        print_json(metrics_snapshot(args.db, args.day))
        return

    parser.error(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    main()

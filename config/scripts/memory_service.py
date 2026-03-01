#!/usr/bin/env python3
"""Memory service backing script generation and content freshness.

This module provides a small SQLite-backed service for:
- storing recent on-air mentions with timestamps,
- generating recency penalties for prompt construction,
- managing topic lifecycle states,
- persisting persona lexical style memory,
- detecting duplicate scripts using string and semantic similarity,
- resetting memory by show/day/week/all scopes.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sqlite3
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
import sys
from typing import Iterable, Optional


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.security.approval_policy import (
    ActionId,
    parse_approval_chain,
    require_approval,
)  # noqa: E402

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "memory_service.db"
TOKEN_RE = re.compile(r"[a-z0-9']+")
MENTION_KINDS = {"song", "topic", "trivia", "caller", "promo"}


@dataclass
class DuplicateResult:
    is_duplicate: bool
    reason: str
    best_match_id: Optional[int]
    string_similarity: float
    semantic_similarity: float


class MemoryService:
    def __init__(self, db_path: Path = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS mentions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                text TEXT NOT NULL,
                show_id TEXT,
                persona TEXT,
                metadata_json TEXT,
                mentioned_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_mentions_time ON mentions(mentioned_at);
            CREATE INDEX IF NOT EXISTS idx_mentions_show ON mentions(show_id);
            CREATE INDEX IF NOT EXISTS idx_mentions_kind ON mentions(kind);

            CREATE TABLE IF NOT EXISTS generated_scripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                show_id TEXT,
                persona TEXT,
                script_text TEXT NOT NULL,
                generated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_scripts_time ON generated_scripts(generated_at);
            CREATE INDEX IF NOT EXISTS idx_scripts_show ON generated_scripts(show_id);

            CREATE TABLE IF NOT EXISTS persona_style_memory (
                persona TEXT PRIMARY KEY,
                signature_phrases_json TEXT NOT NULL,
                intensity_min REAL NOT NULL,
                intensity_max REAL NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _to_iso(dt: datetime) -> str:
        return dt.astimezone(timezone.utc).isoformat()

    @staticmethod
    def _from_iso(value: str) -> datetime:
        return datetime.fromisoformat(value)

    def close(self) -> None:
        self.conn.close()

    def record_mention(
        self,
        kind: str,
        text: str,
        show_id: Optional[str] = None,
        persona: Optional[str] = None,
        metadata: Optional[dict] = None,
        mentioned_at: Optional[datetime] = None,
    ) -> int:
        normalized_kind = kind.strip().lower()
        if normalized_kind not in MENTION_KINDS:
            raise ValueError(
                f"Unsupported mention kind: {kind}. Expected one of {sorted(MENTION_KINDS)}"
            )
        ts = self._to_iso(mentioned_at or self._utc_now())
        cur = self.conn.execute(
            """
            INSERT INTO mentions(kind, text, show_id, persona, metadata_json, mentioned_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                normalized_kind,
                text.strip(),
                show_id,
                persona,
                json.dumps(metadata or {}),
                ts,
            ),
        )
        self.conn.commit()
        return int(cur.lastrowid)

    def recent_mentions(
        self,
        hours: int = 24,
        show_id: Optional[str] = None,
        kinds: Optional[Iterable[str]] = None,
        limit: int = 100,
    ) -> list[sqlite3.Row]:
        cutoff = self._to_iso(self._utc_now() - timedelta(hours=hours))
        filters = ["mentioned_at >= ?"]
        params: list[object] = [cutoff]

        if show_id:
            filters.append("show_id = ?")
            params.append(show_id)

        normalized_kinds: list[str] = []
        if kinds:
            normalized_kinds = [k.strip().lower() for k in kinds if k.strip()]
            if normalized_kinds:
                filters.append(f"kind IN ({','.join('?' for _ in normalized_kinds)})")
                params.extend(normalized_kinds)

        params.append(limit)
        query = (
            "SELECT id, kind, text, show_id, persona, metadata_json, mentioned_at "
            f"FROM mentions WHERE {' AND '.join(filters)} ORDER BY mentioned_at DESC LIMIT ?"
        )
        return list(self.conn.execute(query, params))

    def topic_lifecycle(self, topic: str, show_id: Optional[str] = None) -> dict:
        return self.topic_lifecycles([topic], show_id=show_id)[0]

    def topic_lifecycles(
        self, topics: list[str], show_id: Optional[str] = None
    ) -> list[dict]:
        lookback_hours = 168
        rows = self.recent_mentions(
            hours=lookback_hours, show_id=show_id, kinds=["topic"], limit=500
        )

        now = self._utc_now()

        topic_mentions = {}
        for r in rows:
            text = r["text"].strip().lower()
            if text not in topic_mentions:
                topic_mentions[text] = []
            topic_mentions[text].append(self._from_iso(r["mentioned_at"]))

        results = []
        for topic in topics:
            topic_norm = topic.strip().lower()
            mention_times = topic_mentions.get(topic_norm, [])
            mention_times.sort(reverse=True)

            mentions_24h = sum(
                1 for ts in mention_times if now - ts <= timedelta(hours=24)
            )
            mentions_72h = sum(
                1 for ts in mention_times if now - ts <= timedelta(hours=72)
            )
            last_seen_hours = None
            if mention_times:
                last_seen_hours = (now - mention_times[0]).total_seconds() / 3600.0

            if not mention_times:
                state = "fresh"
            elif mentions_24h >= 3:
                state = "saturated"
            elif mentions_72h >= 2:
                state = "warming"
            elif last_seen_hours is not None and last_seen_hours >= 24:
                state = "cooldown"
            else:
                state = "warming"

            results.append(
                {
                    "topic": topic,
                    "state": state,
                    "mentions_24h": mentions_24h,
                    "mentions_72h": mentions_72h,
                    "last_seen_hours": round(last_seen_hours, 2)
                    if last_seen_hours is not None
                    else None,
                }
            )

        return results

    def recency_penalties(
        self,
        show_id: Optional[str] = None,
        half_life_hours: float = 6.0,
        max_penalty: float = 2.5,
    ) -> dict[str, float]:
        rows = self.recent_mentions(hours=48, show_id=show_id, limit=500)
        now = self._utc_now()
        penalties: dict[str, float] = {}

        for row in rows:
            phrase = row["text"].strip().lower()
            ts = self._from_iso(row["mentioned_at"])
            age_hours = max((now - ts).total_seconds() / 3600.0, 0.0)
            decay = math.exp(-math.log(2) * (age_hours / max(half_life_hours, 0.1)))
            penalties[phrase] = penalties.get(phrase, 0.0) + max_penalty * decay

        return {
            k: round(min(v, max_penalty), 3)
            for k, v in sorted(penalties.items(), key=lambda kv: kv[1], reverse=True)
        }

    def set_persona_style(
        self,
        persona: str,
        signature_phrases: list[str],
        intensity_min: float,
        intensity_max: float,
    ) -> None:
        if intensity_min > intensity_max:
            raise ValueError("intensity_min cannot be greater than intensity_max")

        self.conn.execute(
            """
            INSERT INTO persona_style_memory(persona, signature_phrases_json, intensity_min, intensity_max, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(persona) DO UPDATE SET
                signature_phrases_json=excluded.signature_phrases_json,
                intensity_min=excluded.intensity_min,
                intensity_max=excluded.intensity_max,
                updated_at=excluded.updated_at
            """,
            (
                persona.strip(),
                json.dumps([p.strip() for p in signature_phrases if p.strip()]),
                float(intensity_min),
                float(intensity_max),
                self._to_iso(self._utc_now()),
            ),
        )
        self.conn.commit()

    def get_persona_style(self, persona: str) -> Optional[dict]:
        row = self.conn.execute(
            """
            SELECT persona, signature_phrases_json, intensity_min, intensity_max, updated_at
            FROM persona_style_memory WHERE persona = ?
            """,
            (persona.strip(),),
        ).fetchone()
        if not row:
            return None
        return {
            "persona": row["persona"],
            "signature_phrases": json.loads(row["signature_phrases_json"]),
            "intensity_min": row["intensity_min"],
            "intensity_max": row["intensity_max"],
            "updated_at": row["updated_at"],
        }

    def store_script(
        self,
        script_text: str,
        show_id: Optional[str] = None,
        persona: Optional[str] = None,
    ) -> int:
        cur = self.conn.execute(
            """
            INSERT INTO generated_scripts(show_id, persona, script_text, generated_at)
            VALUES (?, ?, ?, ?)
            """,
            (show_id, persona, script_text.strip(), self._to_iso(self._utc_now())),
        )
        self.conn.commit()
        return int(cur.lastrowid)

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return TOKEN_RE.findall(text.lower())

    @staticmethod
    def _vectorize(tokens: list[str]) -> Counter:
        return Counter(tokens)

    @staticmethod
    def _cosine_similarity(a: Counter, b: Counter) -> float:
        if not a or not b:
            return 0.0
        dot = sum(a[k] * b.get(k, 0) for k in a)
        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def detect_duplicate(
        self,
        script_text: str,
        show_id: Optional[str] = None,
        string_threshold: float = 0.9,
        semantic_threshold: float = 0.82,
        lookback_days: int = 30,
    ) -> DuplicateResult:
        cutoff = self._to_iso(self._utc_now() - timedelta(days=lookback_days))
        filters = ["generated_at >= ?"]
        params: list[object] = [cutoff]
        if show_id:
            filters.append("show_id = ?")
            params.append(show_id)

        rows = list(
            self.conn.execute(
                f"SELECT id, script_text FROM generated_scripts WHERE {' AND '.join(filters)} ORDER BY generated_at DESC LIMIT 250",
                params,
            )
        )

        current_text = script_text.strip()
        current_vec = self._vectorize(self._tokenize(current_text))

        best = DuplicateResult(False, "no prior scripts", None, 0.0, 0.0)
        for row in rows:
            prev_text = row["script_text"]
            string_sim = SequenceMatcher(None, current_text, prev_text).ratio()
            semantic_sim = self._cosine_similarity(
                current_vec, self._vectorize(self._tokenize(prev_text))
            )
            stronger = max(string_sim, semantic_sim) > max(
                best.string_similarity, best.semantic_similarity
            )
            if stronger:
                reason = "semantic" if semantic_sim >= string_sim else "string"
                best = DuplicateResult(
                    False, reason, int(row["id"]), string_sim, semantic_sim
                )
            if string_sim >= string_threshold or semantic_sim >= semantic_threshold:
                reason = []
                if string_sim >= string_threshold:
                    reason.append("string")
                if semantic_sim >= semantic_threshold:
                    reason.append("semantic")
                return DuplicateResult(
                    True, "+".join(reason), int(row["id"]), string_sim, semantic_sim
                )

        return best

    def build_prompt_context(
        self, persona: Optional[str] = None, show_id: Optional[str] = None
    ) -> dict:
        penalties = self.recency_penalties(show_id=show_id)
        top_penalties = list(penalties.items())[:12]

        topics = self.recent_mentions(
            hours=72, show_id=show_id, kinds=["topic"], limit=150
        )
        unique_topics: list[str] = []
        seen: set[str] = set()
        for row in topics:
            topic = row["text"].strip()
            key = topic.lower()
            if key not in seen:
                seen.add(key)
                unique_topics.append(topic)
            if len(unique_topics) >= 10:
                break

        lifecycle = self.topic_lifecycles(unique_topics, show_id=show_id)
        persona_style = self.get_persona_style(persona) if persona else None

        return {
            "show_id": show_id,
            "persona": persona,
            "recency_penalties": [
                {"phrase": p, "penalty": score} for p, score in top_penalties
            ],
            "topic_lifecycle": lifecycle,
            "persona_style_memory": persona_style,
            "generation_guidance": {
                "avoid_high_penalty_phrases": [
                    p for p, score in top_penalties if score >= 1.5
                ],
                "prioritize_fresh_topics": [
                    t["topic"] for t in lifecycle if t["state"] == "fresh"
                ],
                "deprioritize_saturated_topics": [
                    t["topic"] for t in lifecycle if t["state"] == "saturated"
                ],
            },
        }

    def reset_memory(
        self, scope: str, show_id: Optional[str] = None, now: Optional[datetime] = None
    ) -> dict:
        now = now or self._utc_now()
        scope = scope.strip().lower()
        if scope not in {"show", "day", "week", "all"}:
            raise ValueError("scope must be one of: show, day, week, all")

        deleted = {"mentions": 0, "generated_scripts": 0, "persona_style_memory": 0}

        if scope == "show":
            if not show_id:
                raise ValueError("show_id is required when scope='show'")
            for table in ("mentions", "generated_scripts"):
                cur = self.conn.execute(
                    f"DELETE FROM {table} WHERE show_id = ?", (show_id,)
                )
                deleted[table] = cur.rowcount
        elif scope in {"day", "week"}:
            start = now - timedelta(days=1 if scope == "day" else 7)
            start_iso = self._to_iso(start)
            for table, column in (
                ("mentions", "mentioned_at"),
                ("generated_scripts", "generated_at"),
            ):
                if show_id:
                    cur = self.conn.execute(
                        f"DELETE FROM {table} WHERE {column} >= ? AND show_id = ?",
                        (start_iso, show_id),
                    )
                else:
                    cur = self.conn.execute(
                        f"DELETE FROM {table} WHERE {column} >= ?", (start_iso,)
                    )
                deleted[table] = cur.rowcount
        else:  # all
            for table in ("mentions", "generated_scripts", "persona_style_memory"):
                cur = self.conn.execute(f"DELETE FROM {table}")
                deleted[table] = cur.rowcount

        self.conn.commit()
        return {"scope": scope, "show_id": show_id, "deleted": deleted}


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Memory service for RoboDJ script generation freshness"
    )
    parser.add_argument(
        "--db", default=str(DEFAULT_DB_PATH), help="Path to memory SQLite database"
    )

    sub = parser.add_subparsers(dest="command", required=True)

    mention = sub.add_parser("mention", help="Store a mention event")
    mention.add_argument("--kind", required=True, choices=sorted(MENTION_KINDS))
    mention.add_argument("--text", required=True)
    mention.add_argument("--show-id")
    mention.add_argument("--persona")
    mention.add_argument("--metadata", default="{}", help="JSON metadata")

    style_set = sub.add_parser("style-set", help="Set persona lexical style memory")
    style_set.add_argument("--persona", required=True)
    style_set.add_argument("--signature-phrase", action="append", default=[])
    style_set.add_argument("--intensity-min", type=float, required=True)
    style_set.add_argument("--intensity-max", type=float, required=True)

    style_get = sub.add_parser("style-get", help="Get persona lexical style memory")
    style_get.add_argument("--persona", required=True)

    sub.add_parser("prompt-context", help="Build prompt context JSON").add_argument(
        "--show-id"
    )
    subpar = sub.choices["prompt-context"]
    subpar.add_argument("--persona")

    topic_state = sub.add_parser("topic-state", help="Get lifecycle state for a topic")
    topic_state.add_argument("--topic", required=True)
    topic_state.add_argument("--show-id")

    script_store = sub.add_parser("script-store", help="Store generated script text")
    script_store.add_argument("--script", required=True)
    script_store.add_argument("--show-id")
    script_store.add_argument("--persona")

    script_check = sub.add_parser("script-check", help="Check script for duplicates")
    script_check.add_argument("--script", required=True)
    script_check.add_argument("--show-id")
    script_check.add_argument("--string-threshold", type=float, default=0.9)
    script_check.add_argument("--semantic-threshold", type=float, default=0.82)

    reset = sub.add_parser("reset", help="Reset memory by scope")
    reset.add_argument("--scope", required=True, choices=["show", "day", "week", "all"])
    reset.add_argument("--show-id")
    reset.add_argument(
        "--approval-chain", default="[]", help="JSON array of TI-039 approvals"
    )

    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    service = MemoryService(Path(args.db))

    try:
        if args.command == "mention":
            metadata = json.loads(args.metadata)
            mention_id = service.record_mention(
                kind=args.kind,
                text=args.text,
                show_id=args.show_id,
                persona=args.persona,
                metadata=metadata,
            )
            print(json.dumps({"mention_id": mention_id}, indent=2))

        elif args.command == "style-set":
            service.set_persona_style(
                persona=args.persona,
                signature_phrases=args.signature_phrase,
                intensity_min=args.intensity_min,
                intensity_max=args.intensity_max,
            )
            print(json.dumps({"status": "ok", "persona": args.persona}, indent=2))

        elif args.command == "style-get":
            print(json.dumps(service.get_persona_style(args.persona), indent=2))

        elif args.command == "prompt-context":
            print(
                json.dumps(
                    service.build_prompt_context(
                        persona=args.persona, show_id=args.show_id
                    ),
                    indent=2,
                )
            )

        elif args.command == "topic-state":
            print(
                json.dumps(
                    service.topic_lifecycle(topic=args.topic, show_id=args.show_id),
                    indent=2,
                )
            )

        elif args.command == "script-store":
            script_id = service.store_script(
                script_text=args.script, show_id=args.show_id, persona=args.persona
            )
            print(json.dumps({"script_id": script_id}, indent=2))

        elif args.command == "script-check":
            result = service.detect_duplicate(
                script_text=args.script,
                show_id=args.show_id,
                string_threshold=args.string_threshold,
                semantic_threshold=args.semantic_threshold,
            )
            print(json.dumps(result.__dict__, indent=2))

        elif args.command == "reset":
            require_approval(
                ActionId.ACT_DELETE, parse_approval_chain(args.approval_chain)
            )
            print(
                json.dumps(
                    service.reset_memory(scope=args.scope, show_id=args.show_id),
                    indent=2,
                )
            )

        return 0
    finally:
        service.close()


if __name__ == "__main__":
    raise SystemExit(main())

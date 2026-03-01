#!/usr/bin/env python3
"""Inspect SQLite databases used by RoboDJ.

Usage examples:
    python inspect_db.py
    python inspect_db.py --db settings.db --db user_content.db --json
    python inspect_db.py --include-sql --table schedules
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Show SQLite schema metadata for one or more databases."
    )
    parser.add_argument(
        "--db",
        action="append",
        dest="databases",
        help="Database path (relative or absolute). May be used multiple times.",
    )
    parser.add_argument(
        "--table",
        action="append",
        dest="tables",
        help="Filter output to one or more specific tables.",
    )
    parser.add_argument(
        "--include-sql",
        action="store_true",
        help="Include CREATE TABLE SQL in output.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output machine-readable JSON instead of plain text.",
    )
    return parser.parse_args()


def fetch_table_names(cursor: sqlite3.Cursor) -> list[str]:
    cursor.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name;
        """
    )
    return [row[0] for row in cursor.fetchall()]


def get_schema(db_path: Path, selected_tables: set[str] | None, include_sql: bool) -> dict[str, Any]:
    if not db_path.exists():
        return {"error": f"{db_path} not found"}

    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            all_tables = fetch_table_names(cursor)

            if selected_tables:
                tables = [name for name in all_tables if name in selected_tables]
                missing = sorted(selected_tables - set(all_tables))
            else:
                tables = all_tables
                missing = []

            schema: dict[str, Any] = {"tables": {t: {"columns": []} for t in tables}}

            if not tables:
                if missing:
                    schema["missing_tables"] = missing
                return schema

            if len(tables) < 50:
                placeholders = ",".join("?" for _ in tables)
                query = f"""
                    SELECT m.name, p.cid, p.name, p.type, p."notnull", p.dflt_value, p.pk, m.sql
                    FROM sqlite_master m
                    JOIN pragma_table_info(m.name) p
                    WHERE m.type='table' AND m.name IN ({placeholders})
                    ORDER BY m.name, p.cid
                """
                cursor.execute(query, tuple(tables))
            else:
                query = """
                    SELECT m.name, p.cid, p.name, p.type, p."notnull", p.dflt_value, p.pk, m.sql
                    FROM sqlite_master m
                    JOIN pragma_table_info(m.name) p
                    WHERE m.type='table' AND m.name NOT LIKE 'sqlite_%'
                    ORDER BY m.name, p.cid
                """
                cursor.execute(query)

            for row in cursor.fetchall():
                table_name = row[0]
                if table_name not in schema["tables"]:
                    continue

                schema["tables"][table_name]["columns"].append({
                    "cid": row[1],
                    "name": row[2],
                    "type": row[3],
                    "notnull": bool(row[4]),
                    "default": row[5],
                    "pk": bool(row[6]),
                })

                if include_sql and "create_sql" not in schema["tables"][table_name]:
                    if row[7]:
                         schema["tables"][table_name]["create_sql"] = row[7]

            if missing:
                schema["missing_tables"] = missing

            return schema

    except sqlite3.Error as exc:
        return {"error": str(exc)}
    except Exception as exc:
        return {"error": f"Unexpected error: {exc}"}


def render_text(schemas: dict[str, Any]) -> str:
    lines: list[str] = []
    for db_name, db_schema in schemas.items():
        lines.append(f"--- {db_name} ---")

        if "error" in db_schema:
            lines.append(f"ERROR: {db_schema['error']}")
            lines.append("")
            continue

        tables = db_schema.get("tables", {})
        if not tables:
            lines.append("(no matching tables)")
            lines.append("")
            continue

        for table_name, table_data in tables.items():
            lines.append(f"Table: {table_name}")
            for column in table_data.get("columns", []):
                markers = []
                if column["pk"]:
                    markers.append("PK")
                if column["notnull"]:
                    markers.append("NOT NULL")

                marker_str = f" [{' | '.join(markers)}]" if markers else ""
                default_val = column["default"]
                default_str = f" DEFAULT {default_val}" if default_val is not None else ""

                lines.append(
                    f"  - {column['name']}: {column['type']}{default_str}{marker_str}"
                )

            create_sql = table_data.get("create_sql")
            if create_sql:
                lines.append("  create_sql:")
                lines.append(f"    {create_sql}")

        missing_tables = db_schema.get("missing_tables", [])
        if missing_tables:
            lines.append(f"Missing requested tables: {', '.join(missing_tables)}")

        lines.append("")

    return "\n".join(lines).rstrip()


def main() -> None:
    args = parse_args()
    databases = args.databases or ["settings.db", "user_content.db"]
    selected_tables = set(args.tables) if args.tables else None

    schemas: dict[str, Any] = {}
    for db_arg in databases:
        db_path = Path(db_arg)
        schemas[str(db_path)] = get_schema(db_path, selected_tables, args.include_sql)

    if args.json:
        print(json.dumps(schemas, indent=2, ensure_ascii=False))
    else:
        print(render_text(schemas))


if __name__ == "__main__":
    main()

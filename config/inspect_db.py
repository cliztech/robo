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


def quote_identifier(name: str) -> str:
    """Safely quote an SQLite identifier for PRAGMA statements."""
    return '"' + name.replace('"', '""') + '"'


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


def fetch_table_sql(cursor: sqlite3.Cursor, table_name: str) -> str | None:
    cursor.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,)
    )
    row = cursor.fetchone()
    return row[0] if row else None


def get_schema(db_path: Path, selected_tables: set[str] | None, include_sql: bool) -> dict[str, Any]:
    if not db_path.exists():
        return {"error": f"{db_path} not found"}

    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            all_tables = fetch_table_names(cursor)

            if selected_tables:
                tables = [name for name in all_tables if name in selected_tables]
            else:
                tables = all_tables

            schema: dict[str, Any] = {"tables": {}}

            for table in tables:
                pragma_table = quote_identifier(table)
                cursor.execute(f"PRAGMA table_info({pragma_table});")
                columns = [
                    {
                        "cid": row[0],
                        "name": row[1],
                        "type": row[2],
                        "notnull": bool(row[3]),
                        "default": row[4],
                        "pk": bool(row[5]),
                    }
                    for row in cursor.fetchall()
                ]

                table_data: dict[str, Any] = {"columns": columns}
                if include_sql:
                    table_data["create_sql"] = fetch_table_sql(cursor, table)
                schema["tables"][table] = table_data

            if selected_tables:
                missing = sorted(selected_tables - set(tables))
                if missing:
                    schema["missing_tables"] = missing

            return schema
    except sqlite3.Error as exc:
        return {"error": str(exc)}


def render_text(schemas: dict[str, dict[str, Any]]) -> str:
    lines: list[str] = []
    for db_name, db_schema in schemas.items():
        lines.append(f"--- {db_name} ---")

        if "error" in db_schema:
            lines.append(f"ERROR: {db_schema['error']}")
            lines.append("")
            continue

        tables: dict[str, dict[str, Any]] = db_schema.get("tables", {})
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
                marker_text = f" [{' | '.join(markers)}]" if markers else ""
                default_text = (
                    f" DEFAULT {column['default']}" if column["default"] is not None else ""
                )
                lines.append(
                    f"  - {column['name']}: {column['type']}{default_text}{marker_text}"
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

    schemas: dict[str, dict[str, Any]] = {}
    for db_arg in databases:
        db_path = Path(db_arg)
        schemas[str(db_path)] = get_schema(db_path, selected_tables, args.include_sql)

    if args.json:
        print(json.dumps(schemas, indent=2, ensure_ascii=False))
    else:
        print(render_text(schemas))


if __name__ == "__main__":
    main()

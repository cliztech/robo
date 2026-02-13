"""Inspect SQLite schemas for RoboDJ config databases.

Usage:
    python inspect_db.py [--settings-db PATH] [--user-content-db PATH] [--format json|table]

When DB paths are omitted, defaults are resolved relative to this script's directory.
"""

import argparse
import json
import os
import re
import sqlite3
import sys
from typing import Any

VALID_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def quote_identifier(identifier: str) -> str:
    """Return a safely quoted SQLite identifier."""
    return '"' + identifier.replace('"', '""') + '"'


def normalize_default_path(filename: str) -> str:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(script_dir, filename)


def get_table_names(cursor: sqlite3.Cursor) -> tuple[list[str], list[str]]:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    invalid_names_set = {name for name in tables if not VALID_IDENTIFIER_PATTERN.match(name)}
    valid_names = [name for name in tables if name not in invalid_names_set]
    return valid_names, list(invalid_names_set)


def inspect_db(db_path: str) -> dict[str, Any]:
    result: dict[str, Any] = {
        "db_path": db_path,
        "ok": False,
        "tables": {},
        "warnings": [],
        "error": None,
    }

    if not os.path.exists(db_path):
        result["error"] = f"Database not found: {db_path}"
        return result

    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            table_names, invalid_names = get_table_names(cursor)

            for name in invalid_names:
                result["warnings"].append(
                    f"Skipped table with unsupported identifier format: {name!r}"
                )

            for table in table_names:
                quoted_table = quote_identifier(table)
                cursor.execute(f"PRAGMA table_info({quoted_table});")
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
                result["tables"][table] = columns

        result["ok"] = True
        return result
    except sqlite3.Error as exc:
        result["error"] = f"SQLite error: {exc}"
        return result
    except Exception as exc:  # defensive fallback for CI visibility
        result["error"] = f"Unexpected error: {exc}"
        return result


def render_table(results: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for db in results:
        lines.append(f"Database: {db['db_path']}")
        lines.append(f"Status: {'OK' if db['ok'] else 'FAILED'}")

        if db["warnings"]:
            lines.append("Warnings:")
            for warning in db["warnings"]:
                lines.append(f"  - {warning}")

        if db["error"]:
            lines.append(f"Error: {db['error']}")
            lines.append("")
            continue

        if not db["tables"]:
            lines.append("(no tables found)")
            lines.append("")
            continue

        for table_name, columns in db["tables"].items():
            lines.append(f"  Table: {table_name}")
            for col in columns:
                lines.append(
                    "    - "
                    f"{col['name']} "
                    f"({col['type'] or 'UNKNOWN'}) "
                    f"notnull={col['notnull']} pk={col['pk']} "
                    f"default={col['default']!r}"
                )
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect SQLite schemas for settings and user content databases."
    )
    parser.add_argument(
        "--settings-db",
        help="Path to settings DB file (default: config/settings.db relative to this script)",
    )
    parser.add_argument(
        "--user-content-db",
        help="Path to user content DB file (default: config/user_content.db relative to this script)",
    )
    parser.add_argument(
        "--format",
        choices=("json", "table"),
        default="json",
        help="Output format (default: json)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    settings_db = args.settings_db or normalize_default_path(DEFAULT_SETTINGS_DB)
    user_content_db = args.user_content_db or normalize_default_path(DEFAULT_USER_CONTENT_DB)

    results = [inspect_db(settings_db), inspect_db(user_content_db)]

    payload = {"databases": results, "ok": all(db["ok"] for db in results)}

    if args.format == "json":
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print(render_table(results), end="")

    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())

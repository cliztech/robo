from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from backend.security.audit_export import export_audit_batch


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export immutable security audit NDJSON batches")
    parser.add_argument(
        "--source-log",
        default="config/logs/security_audit.ndjson",
        help="Source security audit NDJSON log path",
    )
    parser.add_argument(
        "--batch-id",
        default=None,
        help="Batch id override (defaults to generated value)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    batch_id = args.batch_id or f"batch-{uuid4().hex[:12]}"
    result = export_audit_batch(
        source_log_path=Path(args.source_log),
        batch_id=batch_id,
        export_root=Path("artifacts/security/audit_exports"),
        export_date=datetime.now(timezone.utc),
    )
    print(f"export_path={result.export_path}")
    print(f"manifest_path={result.manifest_path}")
    print(f"digest_sha256={result.digest_sha256}")
    print(f"record_count={result.record_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

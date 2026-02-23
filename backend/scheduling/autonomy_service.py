from __future__ import annotations

import json
import logging
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from pydantic import ValidationError

from .autonomy_policy import (
    AutonomyPolicy,
    DecisionType,
    EffectivePolicyDecision,
    GlobalMode,
    PolicyAuditEvent,
)
from .conflict_detection import PolicyConflict, detect_policy_conflicts
from .observability import emit_scheduler_event


class PolicyValidationError(ValueError):
    def __init__(self, conflicts: List[PolicyConflict]) -> None:
        super().__init__("Autonomy policy contains conflicting overrides.")
        self.conflicts = conflicts


LEGACY_MODE_MAP = {
    "manual": GlobalMode.manual_assist,
    "assisted": GlobalMode.semi_auto,
    "autonomous": GlobalMode.auto_with_human_override,
}


logger = logging.getLogger(__name__)


class AutonomyPolicyService:
    def __init__(
        self,
        policy_path: Path = Path("config/autonomy_policy.json"),
        audit_log_path: Path = Path("config/logs/autonomy_audit_events.jsonl"),
    ) -> None:
        self.policy_path = policy_path
        self.audit_log_path = audit_log_path
        self.event_log_path = Path("config/logs/scheduler_events.jsonl")
        self.policy_path.parent.mkdir(parents=True, exist_ok=True)
        self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
        self._cached_policy: Optional[AutonomyPolicy] = None
        self._last_mtime: Optional[float] = None

    def get_policy(self) -> AutonomyPolicy:
        started = time.perf_counter()
        if not self.policy_path.exists():
            default_policy = AutonomyPolicy()
            self.update_policy(default_policy)
            duration_ms = int((time.perf_counter() - started) * 1000)
            emit_scheduler_event(
                event_name="scheduler.startup_validation.succeeded",
                level="info",
                message="Autonomy policy bootstrap validation succeeded with defaults.",
                metadata={
                    "validation_target": str(self.policy_path),
                    "validation_stage": "bootstrap_default",
                    "duration_ms": duration_ms,
                },
                event_name="scheduler.startup_validation.succeeded",
                level="info",
                message="Autonomy policy bootstrap validation succeeded with default policy.",
                metadata={
                    "validation_target": str(self.policy_path),
                    "validation_stage": "bootstrap",
                    "duration_ms": duration_ms,
                },
                event_log_path=self.event_log_path,
            )
            return default_policy

        try:
            mtime = self.policy_path.stat().st_mtime
            if self._cached_policy is not None and self._last_mtime == mtime:
                return self._cached_policy
        except OSError:
            # Handle cases where file is inaccessible or deleted between calls
            pass

        try:
            policy = AutonomyPolicy.model_validate_json(self.policy_path.read_text(encoding="utf-8"))
            self.validate_policy(policy)
        except Exception as error:
            duration_ms = int((time.perf_counter() - started) * 1000)
            emit_scheduler_event(
                event_name="scheduler.schedule_parse.failed",
                level="error",
                message="Failed to parse or validate autonomy policy during scheduler startup.",
                metadata={
                    "schedule_path": str(self.policy_path),
                    "error_type": type(error).__name__,
                    "error_excerpt": str(error)[:500],
                },
                event_log_path=self.event_log_path,
            )
            emit_scheduler_event(
                event_name="scheduler.startup_validation.failed",
                level="error",
                message="Autonomy policy startup validation failed.",
                metadata={
                    "validation_target": str(self.policy_path),
                    "validation_stage": "load_and_validate",
                    "duration_ms": duration_ms,
                },
                event_log_path=self.event_log_path,
            )
            raise

        # Update cache
        self._cached_policy = policy
        try:
            self._last_mtime = self.policy_path.stat().st_mtime
        except OSError:
            self._last_mtime = None

        duration_ms = int((time.perf_counter() - started) * 1000)
        emit_scheduler_event(
            event_name="scheduler.startup_validation.succeeded",
            level="info",
            message="Autonomy policy startup validation succeeded.",
            metadata={
                "validation_target": str(self.policy_path),
                "validation_stage": "startup_load",
                "duration_ms": duration_ms,
            },
                "validation_stage": "load_and_validate",
                "duration_ms": duration_ms,
            },
            event_log_path=self.event_log_path,
        )

        return policy

    def update_policy(self, policy: AutonomyPolicy) -> AutonomyPolicy:
        self.validate_policy(policy)
        payload = policy.model_copy(
            update={"updated_at": datetime.now(timezone.utc).isoformat()}
        )
        backup_path: Optional[Path] = None
        if self.policy_path.exists():
            snapshot_dir = self.policy_path.parent / "backups" / "autonomy_policy"
            snapshot_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            backup_path = snapshot_dir / f"autonomy_policy_{timestamp}.json"
            shutil.copy2(self.policy_path, backup_path)
            emit_scheduler_event(
                event_name="scheduler.backup.created",
                level="info",
                message="Autonomy policy backup created before update.",
            backup_stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            backup_path = self.policy_path.with_name(f"{self.policy_path.stem}.{backup_stamp}.bak")
            shutil.copy2(self.policy_path, backup_path)
            emit_scheduler_event(
                event_name="scheduler.backup.created",
                level="info",
                message="Autonomy policy backup created before policy update.",
                metadata={
                    "backup_path": str(backup_path),
                    "source_path": str(self.policy_path),
                    "backup_size_bytes": backup_path.stat().st_size,
                },
                event_log_path=self.event_log_path,
            )

        try:
            self.policy_path.write_text(
                payload.model_dump_json(indent=2),
                encoding="utf-8",
            )
        except OSError:
            if backup_path and backup_path.exists():
                shutil.copy2(backup_path, self.policy_path)
                emit_scheduler_event(
                    event_name="scheduler.backup.restored",
                    level="warning",
                    message="Autonomy policy backup restored after failed policy update.",
                    metadata={
                        "backup_path": str(backup_path),
                        "restore_target": str(self.policy_path),
                        "initiator": "autonomy_policy_service",
                    },
                    event_log_path=self.event_log_path,
                )
            raise

        # Proactively update cache after successful write
        self._cached_policy = payload
        try:
            self._last_mtime = self.policy_path.stat().st_mtime
        except OSError:
            self._last_mtime = None

        return payload

    def validate_policy(self, policy: AutonomyPolicy) -> List[PolicyConflict]:
        conflicts = detect_policy_conflicts(policy)
        if conflicts:
            raise PolicyValidationError(conflicts)
        return conflicts

    def resolve_effective_policy(
        self,
        show_id: Optional[str] = None,
        timeslot_id: Optional[str] = None,
    ) -> EffectivePolicyDecision:
        policy = self.get_policy()

        if timeslot_id:
            for timeslot_override in policy.timeslot_overrides:
                if timeslot_override.id == timeslot_id:
                    mode = timeslot_override.mode
                    permissions = (
                        timeslot_override.permissions
                        if timeslot_override.permissions
                        else policy.mode_permissions[mode]
                    )
                    return EffectivePolicyDecision(
                        show_id=show_id,
                        timeslot_id=timeslot_id,
                        mode=mode,
                        permissions=permissions,
                        source="timeslot_override",
                    )

        if show_id:
            for show_override in policy.show_overrides:
                if show_override.show_id == show_id:
                    mode = show_override.mode
                    permissions = (
                        show_override.permissions
                        if show_override.permissions
                        else policy.mode_permissions[mode]
                    )
                    return EffectivePolicyDecision(
                        show_id=show_id,
                        timeslot_id=timeslot_id,
                        mode=mode,
                        permissions=permissions,
                        source="show_override",
                    )

        default_mode = policy.station_default_mode
        return EffectivePolicyDecision(
            show_id=show_id,
            timeslot_id=timeslot_id,
            mode=default_mode,
            permissions=policy.mode_permissions[default_mode],
            source="station_default",
        )

    def record_audit_event(
        self,
        decision_type: DecisionType,
        origin: str,
        show_id: Optional[str] = None,
        timeslot_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> PolicyAuditEvent:
        effective = self.resolve_effective_policy(show_id=show_id, timeslot_id=timeslot_id)
        event = PolicyAuditEvent(
            event_id=str(uuid4()),
            decision_type=decision_type,
            origin=origin,
            mode=effective.mode,
            source=effective.source,
            show_id=show_id,
            timeslot_id=timeslot_id,
            notes=notes,
        )
        with self.audit_log_path.open("a", encoding="utf-8") as handle:
            handle.write(event.model_dump_json() + "\n")
        return event

    @staticmethod
    def _read_last_lines(file_path: Path, limit: int) -> List[str]:
        if not file_path.exists():
            return []

        try:
            file_size = file_path.stat().st_size
        except OSError:
            return []

        if file_size == 0:
            return []

        chunk_size = 8192

        with file_path.open("rb") as f:
            if file_size <= chunk_size:
                f.seek(0)
                content = f.read().decode("utf-8")
                return content.splitlines()[-limit:]

            remaining_bytes = file_size
            buffer = b""

            while remaining_bytes > 0:
                read_size = min(chunk_size, remaining_bytes)
                remaining_bytes -= read_size
                f.seek(remaining_bytes)
                chunk = f.read(read_size)
                buffer = chunk + buffer

                parts = buffer.split(b'\n')
                # If the last part is empty (because file ends with newline), don't count it as a line yet
                valid_count = len(parts)
                if parts and parts[-1] == b'':
                    valid_count -= 1

                # We need > limit lines to ensure the last 'limit' lines are complete
                # (since the first one in 'parts' might be partial)
                if valid_count > limit:
                    break

            parts = buffer.split(b'\n')
            if parts and parts[-1] == b'':
                parts.pop()

            if len(parts) > limit:
                parts = parts[-limit:]

            return [line.decode("utf-8") for line in parts]

    def list_audit_events(self, limit: int = 100) -> List[PolicyAuditEvent]:
        if not self.audit_log_path.exists():
            return []

        lines = self._read_last_lines(self.audit_log_path, limit)
        events: List[PolicyAuditEvent] = []
        invalid_line_count = 0

        for line in lines:
            try:
                events.append(PolicyAuditEvent.model_validate(json.loads(line)))
            except (json.JSONDecodeError, ValidationError):
                invalid_line_count += 1

        if invalid_line_count:
            logger.warning(
                "Skipped %s invalid autonomy audit event lines from %s",
                invalid_line_count,
                self.audit_log_path,
            )

        return events

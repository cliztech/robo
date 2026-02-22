from __future__ import annotations

import json
import logging
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
        self.policy_path.parent.mkdir(parents=True, exist_ok=True)
        self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
        self._cached_policy: Optional[AutonomyPolicy] = None
        self._last_mtime: Optional[float] = None

    def get_policy(self) -> AutonomyPolicy:
        # TODO(observability): emit scheduler.startup_validation.succeeded/failed
        # during scheduler bootstrap policy/config validation.
        if not self.policy_path.exists():
            default_policy = AutonomyPolicy()
            self.update_policy(default_policy)
            return default_policy

        try:
            mtime = self.policy_path.stat().st_mtime
            if self._cached_policy is not None and self._last_mtime == mtime:
                return self._cached_policy
        except OSError:
            # Handle cases where file is inaccessible or deleted between calls
            pass

        policy = AutonomyPolicy.model_validate_json(self.policy_path.read_text(encoding="utf-8"))
        self.validate_policy(policy)

        # Update cache
        self._cached_policy = policy
        try:
            self._last_mtime = self.policy_path.stat().st_mtime
        except OSError:
            self._last_mtime = None

        return policy

    def update_policy(self, policy: AutonomyPolicy) -> AutonomyPolicy:
        # TODO(observability): emit scheduler.backup.created before write and
        # scheduler.backup.restored on rollback/restore workflows.
        self.validate_policy(policy)
        payload = policy.model_copy(
            update={"updated_at": datetime.now(timezone.utc).isoformat()}
        )
        self.policy_path.write_text(
            payload.model_dump_json(indent=2),
            encoding="utf-8",
        )

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

# RoboDJ Autonomy Operating Modes Specification

## Purpose
This document defines five autonomy operating modes for RoboDJ automation. The modes control how much the AI can execute automatically across core capabilities:

- Playlisting
- Scripting
- TTS (voice generation)
- Ad insertion
- Caller simulation

Each mode specifies:

1. What the AI may do automatically.
2. What actions require explicit human approval.
3. Emergency stop and rollback expectations.
4. Audit logging requirements.

---

## 1) Manual Assist

### Automatic AI actions
- Suggest playlist candidates only (no direct write to live queue).
- Draft show scripts and liners.
- Generate draft TTS text/voice previews in staging only.
- Recommend ad break placements.
- Draft caller simulation scripts (no live execution).

### Requires approval
- Any write to active playlist/rotation schedule.
- Any live TTS playout action.
- Any ad insertion into the on-air log.
- Any caller simulation segment that is broadcast.
- Any modification of schedule windows, policy, or mode.

### Emergency stop / rollback
- Global stop immediately blocks all automation actions and queued jobs.
- Rollback restores last approved playlist, ad log, and script package snapshot.
- Current on-air item is allowed to finish unless hard-cut is invoked by operator.

### Audit logging
- Log all recommendations with timestamp, model/version, and confidence.
- Log every approval/denial with operator ID and reason code.
- Keep immutable record of snapshots used for rollback.

---

## 2) Semi-Auto (user-approved scripts)

### Automatic AI actions
- Auto-generate scripts, segues, and timing plans for upcoming blocks.
- Auto-propose playlist and ad plans in preflight queue.
- Auto-render TTS assets to staging.
- Auto-generate caller simulation assets for review.

### Requires approval
- Promotion of generated scripts from staging to live.
- Playlist commits that affect upcoming on-air blocks.
- Ad insertion finalization for each break window.
- Any caller simulation execution on-air.
- Policy changes, mode changes, or overrides beyond configured bounds.

### Emergency stop / rollback
- Emergency stop cancels pending promotions and halts further preflight generation.
- Rollback reverts to most recent approved runbook for affected block.
- Operator can selectively rollback one subsystem (e.g., ads only) or all.

### Audit logging
- Log generation artifact IDs and hash fingerprints.
- Log reviewer decision trail for each artifact.
- Record time-to-approve metrics and any approval SLA breaches.

---

## 3) Auto with Human Override

### Automatic AI actions
- Auto-commit playlist changes within configured policy bounds.
- Auto-publish scripts and TTS for normal segments.
- Auto-insert ads from approved campaign pool and spacing rules.
- Auto-run caller simulation with approved personas and templates.
- Auto-adjust timing for minor drift correction.

### Requires approval
- Actions exceeding guardrails (content risk, category exclusions, quota limits).
- New ad campaigns, new voices/personas, or unapproved sponsors.
- Hard transitions, emergency cut-ins, or policy edits.

### Emergency stop / rollback
- Human override button immediately pauses all autonomous writes.
- One-click rollback restores prior stable state per subsystem.
- Forced safe mode fallback to Manual Assist until operator re-arms autonomy.

### Audit logging
- Full action log including policy check decisions (pass/fail + rule IDs).
- Capture override interventions, pause durations, and resume actor.
- Retain before/after diffs for playlist, ad, and script state.

---

## 4) Full Auto Guardrailed

### Automatic AI actions
- End-to-end autonomous operation for playlisting, scripting, TTS, ad insertion,
  and caller simulation.
- Dynamic scheduling optimization within pre-approved windows.
- Autonomous incident handling for recoverable faults (retry/fallback assets).

### Requires approval
- Any requested change to guardrail policy or compliance constraints.
- Use of assets outside approved catalogs.
- Any high-severity anomaly flagged by policy engine.

### Emergency stop / rollback
- Auto-trips to safe playlist on policy breach or repeated runtime errors.
- Emergency stop switches immediately to fallback music bed + static legal ID flow.
- Rollback applies latest verified checkpoint and resumes in reduced-risk mode.

### Audit logging
- Tamper-evident append-only logs for every autonomous decision.
- Mandatory policy-evaluation trace with deterministic rule snapshots.
- Store incident timelines and automated remediation steps.

---

## 5) Lights-Out Overnight

### Automatic AI actions
- Fully autonomous overnight operation in constrained schedule windows.
- Pre-baked low-risk content templates for scripts/TTS/caller simulation.
- Autonomous ad insertion from overnight-approved campaigns only.
- Auto-recovery from transient failures with conservative fallbacks.

### Requires approval
- Any operation outside defined overnight window.
- Any content class marked high sensitivity.
- Any live human-call simulation not from overnight-approved template set.
- Escalation to daypart content pools or non-overnight sponsor inventory.

### Emergency stop / rollback
- If unattended anomaly threshold is exceeded, switch to safe overnight loop.
- Rollback restores previous overnight baseline package.
- Auto-notify on-call operator with incident summary and required actions.

### Audit logging
- Elevated overnight telemetry granularity (heartbeat + decision events).
- Mandatory unattended-operation markers in each log entry.
- Morning handoff report summarizing actions, incidents, and rollbacks.

---

## Cross-Mode Invariants

- All modes must support a **global emergency stop**.
- All live writes must have **traceable provenance** (who/what/when/why).
- All rollback operations must reference a **versioned checkpoint**.
- Mode transitions must be logged and require an authenticated actor.
- Guardrail violations always produce a structured incident log record.

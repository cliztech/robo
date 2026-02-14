# DGN-DJ Autonomy Operating Modes Specification

> Part of the **DGN-DJ by DGNradio** platform. See [`AGENTS.md`](../AGENTS.md) for agent pipeline rules.

## Purpose

This document defines five autonomy operating modes for DGN-DJ automation. The modes control how much the AI can execute automatically across core capabilities:

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

---

## Operator UI: Decision Trace Visibility Specification

This section defines a standard UI pattern for exposing autonomous decisions in live operations, aligned with the audit and rollback requirements above and with instrumentation fields in `config/scripts/instrumentation/schema.sql` and `telemetry_store.py`.

### 1) Standardized AI Action Card

Each autonomous write or recommendation must render as an **AI action card** in the operator UI.

#### Card fields (required)

1. **Action**
   - Human-readable verb + target.
   - Example: `Inserted ad break plan into 14:35 block`.
2. **Confidence**
   - Numeric confidence (`ai_confidence`) + visual pill (`High`, `Medium`, `Low`).
   - Show raw score (e.g., `0.86`) and normalized percent (`86%`).
3. **Policy rule path**
   - Display `selected_rule_path` exactly as evaluated.
   - Must be copyable for fast escalation.
4. **Affected assets**
   - Item IDs and subsystem scope (playlist/script/TTS/ad/caller simulation).
   - Use `selected_item_id` plus IDs from `metadata_json`/`decision_inputs_json` where present.
5. **Rollback controls**
   - Primary: `Rollback` (subsystem scope).
   - Secondary: `Rollback all to checkpoint` (global scope, guarded confirm).
   - Show checkpoint/version reference required by cross-mode invariants.

#### Card states

- `Pending approval` (Manual Assist / Semi-Auto)
- `Applied automatically` (Auto with Human Override / Full Auto Guardrailed / Lights-Out)
- `Rolled back`
- `Superseded`

### 2) Progressive Disclosure Pattern

Use two levels of visibility so live operators can scan quickly under pressure and investigate deeply only when needed.

#### A) Live view (compact summary row)

Show one-line summary per action:

- Timestamp (`decision_ts` or `event_ts`)
- Action label
- Confidence pill
- Severity badge (`WARN`, `ERROR`, `RECOVERED`, `INFO`)
- Quick controls: `Pause`, `Rollback`, `Acknowledge`

Interaction requirements:

- Single click opens detail drawer.
- Keyboard shortcut opens the latest high-severity item.
- Rows auto-sort by newest first, but pin unresolved `ERROR` above `WARN`.

#### B) Detail drawer (deep trace)

Drawer contains full trace payload with operator-safe formatting:

- Decision context (`decision_inputs_json` pretty printed)
- Rule trace (`selected_rule_path`, rule result, guardrail outcome)
- Latency and timing (`decision_latency_ms`, slot start, processing lag)
- Asset graph (before/after references for playlist, scripts, TTS, ads)
- Event correlation (linked `system_events`, `transition_scores`, `script_outcomes`, `ad_delivery`)
- Audit trail (actor, mode, approval/override actions)
- Rollback preview + explicit impact text before execution

### 3) Incident/Recovery Timeline Visualization

Provide a timeline rail specialized for fault-to-recovery flows using telemetry timeline queries.

#### Timeline model

- Source: `telemetry_store.py timeline --minute-ts ... --window-minutes ...`
- Lanes:
  - **Decisions** (`playout_decisions`)
  - **Incidents** (`system_events`, especially dead air/policy violations/runtime errors)
  - **Remediation** (fallback, retry, rollback, safe-mode activation)
  - **Outcome** (`RECOVERED` confirmation event + stabilization window)

#### Visual grammar

- Node shapes:
  - Circle = decision
  - Diamond = alert/incident
  - Square = operator intervention
  - Check-circle = recovery confirmation
- Connectors:
  - Solid = causal sequence
  - Dashed = inferred correlation
- Time axis labels every 30 seconds during active incidents.

#### Operator affordances (always visible in incident context)

- `Pause autonomy` (halts autonomous writes)
- `Rollback` (contextual subsystem rollback)
- `Enter safe mode` (forces Manual Assist behavior)
- `Acknowledge alert` (records operator ownership + timestamp)

For each control, the UI must show:

- Expected blast radius (subsystem/global)
- Estimated recovery impact
- Last checkpoint reference

### 4) Severity Copy + Visual Style Standard

Define consistent copy and color semantics for high-stress readability.

#### WARN

- **Intent:** degraded but service still operating.
- **Label:** `WARN`
- **Example copy:** `Timing drift detected. Auto-correction applied; review suggested.`
- **Style:** amber background/pill, high-contrast dark text, warning icon.
- **Default action emphasis:** `Acknowledge` primary, `Open trace` secondary.

#### ERROR

- **Intent:** service risk or policy breach requiring immediate action.
- **Label:** `ERROR`
- **Example copy:** `Policy guardrail breach blocked live write. Operator action required.`
- **Style:** red background/pill, white or near-white text, critical icon + optional pulse.
- **Default action emphasis:** `Pause autonomy` and `Rollback` as primary actions.

#### RECOVERED

- **Intent:** incident resolved and operation returned to stable state.
- **Label:** `RECOVERED`
- **Example copy:** `Fallback playlist restored service. Stable for 3m; safe mode remains active.`
- **Style:** green/teal confirmation pill with strong contrast and check icon.
- **Default action emphasis:** `Review timeline` primary, `Resume autonomy` guarded secondary.

### 5) Copywriting Constraints for Under-Pressure Comprehension

- Lead with state + impact + next action in that order.
- Keep primary line under ~90 characters in live view.
- Avoid model-internal jargon in headline copy; keep raw fields in detail drawer.
- Prefer explicit verbs: `Paused`, `Rolled back`, `Blocked`, `Recovered`.
- Include timestamps and checkpoint IDs in all rollback-related confirmations.

### 6) Minimum Acceptance Criteria (UI)

1. Every autonomous decision in non-manual modes appears as an AI action card.
2. Every card includes action, confidence, policy rule path, affected assets, and rollback controls.
3. Live view remains scannable at incident load (compact summaries only).
4. Detail drawer exposes full trace needed for audit and post-incident review.
5. Timeline clearly separates incident onset, interventions, and recovery confirmation.
6. WARN/ERROR/RECOVERED styles and copy are consistent across dashboard and alerts.

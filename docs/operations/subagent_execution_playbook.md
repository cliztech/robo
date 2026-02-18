# Subagent Execution Playbook

This runbook is the **normative execution source** for converting roadmap concepts into delivery actions. Use it with `AGENTS.md` (pipeline/route constraints) and `SKILLS.md` (skill activation).

## 1) Spawn Decision: Subagents vs Main Agent

Use the decision table below to decide whether work stays with the main agent or is delegated.

| Condition | Keep in main agent | Spawn subagent(s) |
| --- | --- | --- |
| Task complexity | Single-step or tightly-coupled edit path | Multi-step work with separable streams |
| Domains touched | 1 domain (docs-only, config-only, or QA-only) | 2+ domains (e.g., docs + QA + compliance) |
| Risk profile | Low risk, reversible, no policy ambiguity | Medium/high risk, policy-heavy, or safety-critical |
| Evidence needed | One validation command or simple diff review | Multiple evidence artifacts and cross-checks |
| Time sensitivity | Fast patch preferred, low coordination overhead | Throughput gain expected from concurrent execution |

### Required spawn triggers

Spawn subagents when **any** of the following are true:

1. Work must be split across independent tracks owned by different team roles in `AGENTS.md`.
2. The request requires both implementation and independent verification tracks.
3. The estimated task packet count is `>= 3` and packets are not sequentially blocked.
4. The same artifact needs parallel review perspectives (e.g., QA + SecOps).

### Required no-spawn triggers

Keep work in main agent when **any** of the following are true:

1. The change is a single-file, low-risk edit with one validation gate.
2. Subagent coordination overhead would exceed estimated execution time.
3. The task includes sensitive state handoffs that cannot be safely packetized.

## 2) Parallelism Limits and Priority Queue Policy

## Max parallel subagents

- **Default max parallel:** `3`
- **Hard cap:** `5` (only for incident/hotfix or release-gate scenarios)
- **Minimum active reserve:** keep `1` slot free for urgent escalation packets when running at cap.

## Priority queue policy

All packets enter a single queue with strict priority ordering:

1. **P0 (Blocker/Critical):** security exposure, production outage, release blocker
2. **P1 (High):** user-visible regression, compliance risk, merge-blocking defect
3. **P2 (Normal):** roadmap feature execution, standard QA/doc tasks
4. **P3 (Low):** cleanup, optional optimization, deferred analysis

Tie-break rules (in order):

1. Earliest dependency-unblocked packet first
2. Higher confidence impact reduction first
3. Oldest queued packet first (anti-starvation)

Preemption rules:

- P0 may preempt any running P2/P3 packet.
- P1 may preempt P3 packets only.
- Preempted packets must checkpoint evidence and requeue with original priority.

## 3) Mandatory Task Packet Schema

Every delegated task must use this schema before execution:

```yaml
task_packet:
  packet_id: "PKT-<timestamp>-<slug>"
  route: "QA|Change|Proposal"
  priority: "P0|P1|P2|P3"
  owner_role: "team.agent-role"
  objective: "single measurable outcome"
  scope:
    in_scope_paths: []
    out_of_scope_paths: []
    allowed_ops: ["read", "edit", "validate"]
    forbidden_ops: []
  dependencies:
    blocked_by_packet_ids: []
    external_prerequisites: []
  acceptance_criteria:
    - "observable completion statement"
  evidence_format:
    commands:
      - "exact command"
    artifacts:
      - "path/to/file-or-report"
    citation_requirements:
      - "file citations or line refs required"
  timeout_sla:
    soft_timeout_minutes: 20
    hard_timeout_minutes: 40
  handoff:
    result_contract: "summary + evidence + risk flags"
    escalation_target: "main-agent"
```

## Packet quality gates (must pass before dispatch)

1. Scope is explicit and non-overlapping with sibling packets.
2. Dependencies are complete and reference packet IDs.
3. Acceptance criteria are testable.
4. Evidence format defines exact commands/artifacts.

## 4) Result Reconciliation Rules

Main agent is the reconciler of record and applies these rules in order.

1. **Schema validity first:** Reject results that do not match packet contract.
2. **Conflict detection:** Flag collisions when two packets modify the same semantic unit (file section, config key, or requirement).
3. **Conflict resolution priority:**
   - Safety/compliance constraints
   - Explicit user request
   - `AGENTS.md` boundaries and route constraints
   - Higher-priority packet outcome
   - Latest evidence-backed result
4. **Deduplication:** Merge duplicate findings by canonical key (`file + anchor + issue_type`) and keep strongest evidence.
5. **Confidence ranking:** Score each result from `0.0-1.0` using:
   - Evidence completeness (40%)
   - Validation pass rate (40%)
   - Scope adherence (20%)

### Merge decision policy

- Auto-merge if no conflicts and confidence `>= 0.8`.
- Require main-agent manual review for confidence `0.5-0.79`.
- Reject and re-issue packet for confidence `< 0.5`.

## 5) Failure, Timeout, and Escalation

## Failure classes

- **F1 Recoverable:** transient command/tool error, non-deterministic validation
- **F2 Scope failure:** attempted out-of-scope edit or missing dependency declaration
- **F3 Quality failure:** acceptance criteria unmet or insufficient evidence
- **F4 Systemic:** repeated packet failures indicating plan/design fault

## Timeout handling

1. At soft timeout, subagent must post checkpoint: current status, partial evidence, blocker.
2. At hard timeout, packet auto-pauses and returns to queue as `needs_replan`.
3. After 2 hard timeouts on same packet, escalate as F4.

## Escalation path

1. Subagent -> Main agent (first-line triage)
2. Main agent -> Planner stage (re-scope/re-sequence packets)
3. Planner -> Management role owner (priority/risk arbitration)
4. Management -> Incident/Hotfix path for P0/P1 production risk

## Closure requirements after escalation

- Record root cause category (dependency gap, unclear scope, tool failure, incorrect assumptions).
- Update packet schema or queue policy if systemic issue is confirmed.
- Resume only after revised acceptance criteria are explicit.


## 6) BMAD Config Consistency Check

Run this check when touching any `_bmad/**` config files and before opening a PR that includes BMAD config edits:

```bash
python scripts/validate_bmad_config.py
```

The command fails if required BMAD config files are missing, if `_bmad/bmm/config.yaml` is missing required keys or diverges from `_bmad/core/config.yaml`, or if `_bmad/_config/manifest.yaml` contains duplicate/non-canonical installation/modules sections.

## Operational Notes

- This playbook governs execution behavior for roadmap-to-task translation.
- If this playbook conflicts with higher-priority repository instructions, follow precedence rules in `AGENTS.md`.

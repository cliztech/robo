# TI-011 Implementation Plan — Human-in-the-Loop Checkpoints

## Scope
Define the UX, trigger conditions, and audit trail for human-in-the-loop (HITL) checkpoints during multi-agent workflows. This satisfies MVP requirement B1.2.

## Trigger Conditions
Checkpoints must be presented to the operator when the system detects any of the following high-impact events defined in the orchestration playbook:
1. **Confidence threshold:** Result confidence is between `0.5` and `0.79`.
2. **Scope expansion:** A subagent proposes modifying files outside its initially approved `in_scope_paths`.
3. **Destructive actions:** A proposed plan involves deleting non-temporary resources or dropping database tables.
4. **Release gate bypass:** An attempt to skip a required validation or compliance gate during a deployment or change route.

## UX Flow
When a trigger condition is met, the workflow timeline halts and presents a **Checkpoint Card** with the following components:
- **Context:** Summary of the proposed action and why the checkpoint was triggered.
- **Actions:** Three explicit choices:
  - `Approve`: Proceed with the proposed action.
  - `Request changes`: Return the packet to the subagent/planner with feedback. Requires rationale text.
  - `Rollback`: Cancel the current workflow and revert to the pre-execution snapshot. Requires rationale text.
- **Input:** A required text area for capturing the operator's rationale if `Request changes` or `Rollback` is selected.

## Audit Trail
Every checkpoint decision must be durably logged to the audit trail (e.g., `ai_decisions` table or similar structured log).
The log entry must include:
- `workflow_id` and `packet_id`
- `checkpoint_trigger_reason`
- `operator_role` and `operator_id`
- `decision` (approve, request_changes, rollback)
- `rationale` (text provided by operator)
- `timestamp` (UTC)

## Validation Path
- [ ] Verify that a packet with confidence `0.6` halts execution and displays the Checkpoint Card.
- [ ] Verify that selecting `Approve` resumes execution.
- [ ] Verify that selecting `Request changes` without rationale disables submission.
- [ ] Verify that `Rollback` cleanly aborts the workflow.
- [ ] Verify that the audit trail captures all fields for a completed checkpoint interaction.
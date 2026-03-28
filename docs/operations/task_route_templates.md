# Task Route Templates (Summary)

This file is intentionally a lightweight helper, not policy authority.

- Intake: classify request as read-only validation.
- Scope: list files/surfaces under review.
- Checks: quality, regression, security, and docs consistency.
- Output: ranked findings with severity and remediation stubs.
- Gate: no file edits in QA route, including `.context/activeContext.md` and `.context/progress.md`.
- Gate: include a "state update suggestion" in QA output when follow-up state tracking is advisable.
For canonical routing rules, command selection, and tie-break behavior, use:

- [`docs/operations/agent_governance_map.md`](./agent_governance_map.md)
- [`docs/operations/agent_execution_commands.md` (route-to-command matrix)](./agent_execution_commands.md#05-bmad-route-to-command-matrix-canonical-selection-guide)

- Intake: classify request as implementation.
- Scope: define in-scope files and explicit out-of-scope boundaries.
- Plan: smallest safe sequence with rollback note.
- Execute: apply focused edits and keep behavior parity where required.
- Verify: run build/tests/linters relevant to touched areas.
- Output: changed files, commands run, residual risks.
- Gate: update `.context/activeContext.md` and `.context/progress.md` only when this Change output modifies project state.
## Quick route reminder

- **QA:** read-only validation/audit requests.
- **Change:** scoped implementation requests.
- **Proposal:** architecture/spec/planning requests.

If this file and canonical policy diverge, follow the sources above.

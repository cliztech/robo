# Task Route Templates

## QA Route

- Intake: classify request as read-only validation.
- Scope: list files/surfaces under review.
- Checks: quality, regression, security, and docs consistency.
- Output: ranked findings with severity and remediation stubs.
- Gate: no file edits in QA route.

## Change Route

- Intake: classify request as implementation.
- Scope: define in-scope files and explicit out-of-scope boundaries.
- Plan: smallest safe sequence with rollback note.
- Execute: apply focused edits and keep behavior parity where required.
- Verify: run build/tests/linters relevant to touched areas.
- Output: changed files, commands run, residual risks.

## Proposal Route

- Intake: classify request as design/spec.
- Scope: identify stakeholders and impacted systems.
- Analysis: options, constraints, risks, tradeoffs.
- Recommendation: one preferred path with alternatives.
- Output: acceptance criteria, phased milestones, go/no-go checks.

## Selection Heuristics

- Use `QA` when the user asks to audit, review, validate, or assess readiness.
- Use `Change` when the user asks to implement, fix, or ship.
- Use `Proposal` when the user asks for architecture, PRD, or planning artifacts.

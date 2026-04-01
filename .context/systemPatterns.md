# System Patterns

## Execution architecture
- Stage-gated multi-agent flow: Intake -> Planner -> Executor -> Verifier -> Handoff.
- Route selection uses BMAD-first policy; fallback to standard planning/execution/verification.
- Every change must preserve scope boundaries and verification evidence.

## Repository structure patterns
- Runtime/product assets: `backend/`, `config/`, launcher artifacts at repo root.
- Planning/status artifacts: `docs/exec-plans/active/`, `docs/exec-plans/completed/`, `docs/PLANS.md`.
- Operational controls: `docs/operations/*`, CI scripts in `scripts/ci/`, workflows in `.github/workflows/`.

## Quality and safety patterns
- Hard gates before release and Ready-for-Review transitions.
- Configuration and runtime validation are first-class checks, not optional docs guidance.
- Prefer small scoped commits with Conventional Commit messages.

## Source anchors
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/operations/agent_execution_commands.md`

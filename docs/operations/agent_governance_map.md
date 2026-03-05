# Agent Governance Map

This map defines the single source-of-truth (SoT) file for each instruction domain. If guidance conflicts across files, the domain SoT below wins.

| Instruction domain | Source-of-truth file | Why this file is authoritative |
| --- | --- | --- |
| Routing (QA / Change / Proposal + BMAD command selection) | [`docs/operations/agent_execution_commands.md`](./agent_execution_commands.md#canonical-bmad-startup-policy-codexgeminijules) | Canonical BMAD startup policy and route-to-command matrix are maintained here. |
| Boundaries (Always Do / Ask First / Never Do) | [`AGENTS.md` (Boundaries)](../../AGENTS.md#boundaries) | Repository-wide constraints and edit permissions are defined here. |
| Skill usage (skill catalog, triggers, execution boundaries) | [`SKILLS.md`](../../SKILLS.md) | Skills are registered and constrained in one canonical registry. |
| Stage/quality gates (plan completeness, packet evidence, PR readiness, worktree hygiene) | [`AGENTS.md` (Workflow Quality Gates)](../../AGENTS.md#workflow-quality-gates) | Hard numerical and checklist gates are defined centrally in repo policy. |

## Non-authoritative files policy

Non-authoritative files should summarize governance briefly and link to this map (and the linked SoT sections) instead of duplicating policy blocks.

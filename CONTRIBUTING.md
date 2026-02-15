# Contributing

> **DGN-DJ by DGNradio** — AI-powered radio automation platform

## Before You Start

1. Read [`AGENTS.md`](AGENTS.md) — defines the multi-agent pipeline, three-tier boundaries, and coding style.
2. Read [`SKILLS.md`](SKILLS.md) — defines reusable skill definitions with triggers and guardrails.
3. Read [`CONFIG_VALIDATION.md`](CONFIG_VALIDATION.md) — how to validate config changes before submitting.
4. Read [`docs/development/git_worktree_workflow.md`](docs/development/git_worktree_workflow.md) — standard workflow for parallel branch development with `git worktree`.
5. Read [`docs/development/agent_team_operating_playbook.md`](docs/development/agent_team_operating_playbook.md) — expanded team/manager/sub-agent operating model, tools, skills, references, and self-healing loops.

## Repository Nature

This repository tracks a **packaged DGN-DJ distribution**, not compilable application source code. The `backend/` directory contains Python modules, but the primary executable is a pre-built PyInstaller bundle.

## CI Scope

The CI workflow intentionally runs **distribution/config validation only**:

- JSON syntax validation for `config/*.json`
- JSON schema validation via `python config/validate_config.py`
- Python syntax checks for maintenance scripts (e.g., `config/inspect_db.py`)
- Presence checks for expected distribution artifacts and config layout
- Frontend contract checks via `python config/spec_check_frontend_contracts.py`

## Do Not Add Generic Build Workflows

Please do **not** add default C/C++, CMake, or MSBuild starter workflows unless this repository starts including the corresponding source/build assets.

If build assets are introduced later, add build workflows in a separate pull request with:

1. Which new source/build files were added.
2. Why the new workflow is now required.
3. How the workflow maps to this repository's structure.

## Release / deployment handoff requirements

To avoid process drift, follow the same release gate in deployment and handoff activities:

- Run `python config/validate_config.py`.
- Do not proceed unless output includes: `Configuration validation passed for schedules.json and prompt_variables.json.`
- For risky configuration changes, archive backup snapshots in `config/backups/` and include them with release/deployment artifacts.

## Draft PR Workflow

Use a Draft PR to keep reviewers aligned while larger work is still in-flight.

### When Draft PR is required

Open a Draft PR before implementation is complete when any one of these thresholds is met:

- The change spans **5+ files** or **~300+ net lines changed**.
- The work is expected to take **more than one day** or multiple commits across sessions.
- The change touches **multiple subsystems** (for example: `config/`, `backend/`, and docs together).
- The change introduces moderate/high delivery risk (migration behavior, scheduler logic, orchestration, or production-impacting defaults).

### Required Draft PR template sections

Every Draft PR description must include the sections below.

1. **Scope**
   - What is in this PR right now.
   - What is intentionally out of scope.
2. **Risks**
   - User/ops risks, rollout risks, and rollback strategy.
3. **Test Plan**
   - Commands already run.
   - Commands still pending before promotion to Ready for Review.
4. **Known Gaps**
   - Incomplete behaviors, TODOs, and temporary trade-offs.
5. **Next Checkpoints**
   - Short milestone list with target dates or commit checkpoints.

Suggested starter template:

```md
## Scope
- In scope:
- Out of scope:

## Risks
- Risk:
- Mitigation / rollback:

## Test Plan
- Completed:
- Pending:

## Known Gaps
-

## Next Checkpoints
- [ ] Checkpoint 1
- [ ] Checkpoint 2
```

### Commit/update cadence expectations

- Push updates to the Draft PR at least **once per working day** while active.
- Prefer **small, reviewable commits** with Conventional Commit messages.
- Update the Draft PR description whenever scope, risk, or test status changes.
- If no code moved forward in the last day, post a short status update in the PR timeline.

### Promotion criteria: Draft → Ready for Review

Promote only when all items below are true:

- Scope is stable and the acceptance criteria are implemented.
- Required checks relevant to the change are passing (config validation/tests/lint as applicable).
- Draft PR template sections are fully updated (no placeholder text).
- Known gaps are either resolved or explicitly documented with follow-up owners.
- Reviewer-facing summary is current and includes notable decisions/trade-offs.

### Required reviewer sign-offs before merge

Before merge, collect all applicable sign-offs:

- **1 code owner / maintainer approval** for touched areas.
- **1 QA sign-off** confirming test evidence is sufficient.
- **1 domain sign-off** when relevant to change type:
  - SecOps for security-sensitive changes.
  - DevOps/Release for deployment-impacting changes.
  - Design for UI/UX behavior changes.

If an expected sign-off is not applicable, explicitly note the reason in the PR conversation.

### Optional automation for Draft PR metadata

For consistent formatting, you can use the helper script and docs included in this repository:

- Script: `python scripts/draft_pr_metadata.py`
- Usage docs: `scripts/README_draft_pr_metadata.md`

Typical workflow:

1. Generate a starter metadata file:
   - `python scripts/draft_pr_metadata.py --init draft_pr_metadata.json`
2. Update the metadata values as implementation progresses.
3. Render markdown for your PR body:
   - `python scripts/draft_pr_metadata.py --metadata draft_pr_metadata.json`

If your team prefers a different automation approach, keep the same section headings and output structure defined in this guide.

## Large Change Delivery

For high-impact work, break delivery into explicit milestones instead of one long-running implementation branch.

### Milestone slicing thresholds

Milestone slicing is required when **any one** of these thresholds is met:

- **File count threshold:** expected changes across **10 or more files**.
- **Risk threshold:** change has **moderate/high delivery risk** (migration paths, production defaults, scheduler/orchestration behavior, or rollback complexity).
- **Subsystem threshold:** work spans **3 or more subsystems** (for example: `backend/`, `config/`, docs, scripts, CI).

When thresholds are met, split the effort into reviewable milestones with clear acceptance goals.

### Draft PR per milestone (required)

Each milestone must have its **own Draft PR** with explicit checkpoint goals.

Required milestone PR elements:

1. **Milestone Goal**
   - The checkpoint objective and acceptance criteria for this slice.
2. **In Scope / Out of Scope**
   - Exactly what this milestone includes, and what is deferred.
3. **Checkpoint Goals**
   - Numbered, verifiable outcomes reviewers can validate in this PR.
4. **Validation + Rollback**
   - Evidence collected for this checkpoint and rollback approach if regressions are found.

For consistent formatting and wording, align milestone PR outputs with the [`pr-writer` skill in `SKILLS.md`](SKILLS.md#pr-writer).

### Checkpoint update template

Post this update in the Draft PR description (or timeline update) at each checkpoint:

```md
## Checkpoint Update: <milestone/checkpoint name>

### What changed
-

### What remains
-

### Blockers
- None | <describe blocker + owner + next action>

### Risk update
- Current risk level: Low | Medium | High
- New/changed risks:
- Mitigation and rollback adjustments:

### Validation evidence
- ✅ `<command>` — <result>
- ✅ `<command>` — <result>

### Rollback notes
- Rollback trigger(s):
- Rollback steps:
- Data/config restoration notes:
```

### Checkpoint evidence requirements

Every checkpoint must include:

- **Validation evidence:** concrete command output, test results, or artifact references that prove the checkpoint objective is met.
- **Rollback notes:** explicit rollback triggers, rollback steps, and any data/config restoration implications.

Checkpoints without both validation evidence and rollback notes are incomplete and must not be marked done.

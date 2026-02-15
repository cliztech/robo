# Agent Execution Commands Playbook

Short, runnable command sequences for common execution workflows.

## 1) Non-trivial task planning kickoff

Use this flow when work has multiple steps, dependencies, or risks that need tracking.

### Commands

```bash
# 1) Create a dated plan artifact
mkdir -p docs/operations/plans
PLAN_FILE="docs/operations/plans/$(date +%F)-task-plan.md"
cp docs/operations/templates/task_plan_template.md "$PLAN_FILE" 2>/dev/null || cat > "$PLAN_FILE" <<'MD'
# Task Plan

## Scope
- In scope:
- Out of scope:

## Steps
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Risks
- 

## Validation
- [ ] Command 1
- [ ] Command 2
MD

# 2) Fill in initial scope/steps quickly
${EDITOR:-vi} "$PLAN_FILE"

# 3) Track progress in git-visible checkpoints
git add "$PLAN_FILE"
git commit -m "docs: add task plan artifact for <task-name>"

# 4) Update step checkboxes as work progresses
${EDITOR:-vi} "$PLAN_FILE"
git add "$PLAN_FILE"
git commit -m "docs: update task plan checkpoints for <task-name>"
```

### Expected output snippets

```text
$ git commit -m "docs: add task plan artifact for schedule-hardening"
[feature/schedule-hardening 1a2b3c4] docs: add task plan artifact for schedule-hardening
 1 file changed, 24 insertions(+)
 create mode 100644 docs/operations/plans/2026-02-15-task-plan.md
```

### Failure-recovery notes

- If template copy fails because the template is missing, fallback inline generation (`cat > "$PLAN_FILE"`) still creates a usable plan.
- If `git commit` reports `nothing to commit`, verify edits were saved and staged with `git status --short`.
- If plan content drifts from current scope, add a short `## Scope Change Log` section instead of rewriting history.

---

## 2) Parallel subagent analysis workflow

Use when independent analysis threads can run concurrently and then be merged.

### Commands

```bash
# 1) Create task packet directory
TASK_ROOT="docs/operations/task_packets/$(date +%F)-<task-name>"
mkdir -p "$TASK_ROOT"/{packets,results,merged}

# 2) Create packet stubs for each subagent lane
cat > "$TASK_ROOT/packets/01-research.md" <<'MD'
# Packet: Research
## Question
## Inputs
## Constraints
## Deliverable
MD

cat > "$TASK_ROOT/packets/02-risk-review.md" <<'MD'
# Packet: Risk Review
## Question
## Inputs
## Constraints
## Deliverable
MD

cat > "$TASK_ROOT/packets/03-validation.md" <<'MD'
# Packet: Validation
## Question
## Inputs
## Constraints
## Deliverable
MD

# 3) Collect each lane's output as independent artifacts
# (replace echo with your actual subagent command or script)
echo "research findings" > "$TASK_ROOT/results/01-research.out.md"
echo "risk findings" > "$TASK_ROOT/results/02-risk-review.out.md"
echo "validation findings" > "$TASK_ROOT/results/03-validation.out.md"

# 4) Merge outputs into one review file
cat "$TASK_ROOT"/results/*.md > "$TASK_ROOT/merged/combined-analysis.md"

# 5) Commit packet + results for traceability
git add "$TASK_ROOT"
git commit -m "docs: add parallel analysis packet and merged results for <task-name>"
```

### Expected output snippets

```text
$ cat "$TASK_ROOT"/results/*.md > "$TASK_ROOT/merged/combined-analysis.md"
$ git commit -m "docs: add parallel analysis packet and merged results for prompt-upgrade"
[feature/prompt-upgrade 5d6e7f8] docs: add parallel analysis packet and merged results for prompt-upgrade
 7 files changed, 68 insertions(+)
```

### Failure-recovery notes

- If one lane fails, leave its output file present with a short failure summary and continue merging other lanes.
- If wildcard merge order is ambiguous, enforce ordering with explicit filenames (`01-`, `02-`, `03-`) as shown.
- If task packet contents include sensitive material, redact before commit and note redactions in `merged/combined-analysis.md`.

---

## 3) Draft PR lifecycle

Use for long-running work that should be visible before final review.

### Commands

```bash
# 1) Push branch and open draft PR
git push -u origin <branch-name>
gh pr create \
  --draft \
  --title "docs: <short-title>" \
  --body-file .github/pull_request_template.md

# 2) Update draft checkpoints after each milestone
gh pr edit <pr-number> --body-file /tmp/pr-body-updated.md
gh pr comment <pr-number> --body "Checkpoint: completed validation pass and updated risks section."

# 3) Verify checks + reviewers before promotion
gh pr checks <pr-number>
gh pr view <pr-number> --json reviewRequests,reviews,state

# 4) Mark ready for review
gh pr ready <pr-number>
```

### Expected output snippets

```text
$ gh pr create --draft --title "docs: add execution command playbook" --body-file .github/pull_request_template.md
https://github.com/<org>/<repo>/pull/123

$ gh pr ready 123
✓ Pull request <org>/<repo>#123 is marked as "ready for review"
```

### Failure-recovery notes

- If `gh` is unauthenticated, run `gh auth login` and retry.
- If PR body file is missing, use inline `--body "..."` temporarily and replace with `gh pr edit`.
- If required checks fail, do not mark ready; update PR with failing command output and remediation plan.

---

## 4) Git worktree lifecycle

Use separate worktrees for concurrent changes without constant branch switching.

### Commands

```bash
# 1) Create a new branch worktree
mkdir -p ../worktrees
git worktree add ../worktrees/<branch-name> -b <branch-name> origin/main

# 2) Verify and sync worktree state
git worktree list
cd ../worktrees/<branch-name>
git fetch origin
git rebase origin/main

# 3) Finish work and remove worktree
cd /workspace/robo
git worktree remove ../worktrees/<branch-name>

# 4) Prune stale metadata
git worktree prune
git branch -d <branch-name>   # or -D if intentionally forcing deletion
```

### Expected output snippets

```text
$ git worktree add ../worktrees/docs-agent-playbook -b docs-agent-playbook origin/main
Preparing worktree (new branch 'docs-agent-playbook')
branch 'docs-agent-playbook' set up to track 'origin/main'.
HEAD is now at abc1234 docs: refine contribution guide

$ git worktree prune
```

### Failure-recovery notes

- If `git worktree remove` fails due to uncommitted changes, either commit/stash from the worktree or rerun with `--force` only after review.
- If branch deletion fails (`not fully merged`), inspect with `git log --oneline main..<branch-name>` before deciding on `-D`.
- If stale entries persist in `git worktree list`, run `git worktree prune --verbose` and remove orphaned directories manually.

---

## Quick verification commands

```bash
git status --short
git diff --name-only
```

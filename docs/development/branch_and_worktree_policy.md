# Branch and Worktree Policy

This policy defines how contributors create, sync, publish, and clean up Git branches and worktrees in this repository.

## 1) Branch naming conventions by workflow type

Use lowercase branch names and hyphen-separated slugs after the workflow prefix.

| Workflow type | Prefix | Format | Example |
| --- | --- | --- | --- |
| Feature delivery | `feat/` | `feat/<ticket-or-scope>-<short-slug>` | `feat/scheduler-dead-air-guard` |
| Bug fix | `fix/` | `fix/<ticket-or-scope>-<short-slug>` | `fix/content-engine-timeout` |
| Documentation | `docs/` | `docs/<ticket-or-scope>-<short-slug>` | `docs/branch-worktree-policy` |
| QA / validation tasks | `qa/` | `qa/<ticket-or-scope>-<short-slug>` | `qa/schedule-validation-regression` |

Naming requirements:

- Keep names descriptive but concise.
- Avoid spaces, uppercase letters, underscores, and special characters.
- Do not reuse an active branch name for unrelated work.

## 2) One-worktree-per-branch rule and prohibited patterns

### Rule

Each active branch must map to exactly one local worktree path.

- ✅ Allowed: branch `feat/x` checked out in exactly one worktree directory.
- ❌ Not allowed: the same branch checked out in multiple worktrees simultaneously.

### Prohibited patterns

- Reusing one worktree for multiple concurrent branches by repeatedly switching context.
- Sharing one branch between multiple active worktrees.
- Naming worktrees with ambiguous names such as `tmp`, `test`, or `new`.
- Keeping detached `HEAD` worktrees for ongoing task work.

Recommended:

- Name worktree directories after the branch slug, for example `../wt-feat-scheduler-dead-air-guard`.
- Keep one task per worktree, and close it when the task is merged or abandoned.

## 3) Rebase/merge cadence against integration branch

Use the integration branch as the source of truth for synchronization (typically `main`, unless your team declares another integration branch).

- Rebase (or merge, if team policy requires merge commits) before opening a PR.
- Rebase (or merge) again whenever the branch is behind integration by more than one working day.
- Always sync immediately before moving from draft to ready-for-review status.
- Resolve conflicts locally and rerun required checks before pushing updated history.

Suggested cadence:

1. Start of day: `git fetch --all --prune` and sync branch with integration.
2. Before PR updates: sync again.
3. Before merge: final sync and validation.

## 4) Remote push rules for draft vs ready branches

Use `scripts/setup_git_remotes.sh` as the baseline for remote configuration.

Expected remotes from that script:

- `origin` (SSH): primary fork/repository remote.
- `origin-https` (HTTPS): fallback push remote.
- `upstream` (SSH): optional canonical source remote when `upstream_owner` is provided.

Draft branch rules:

- Push early and often to `origin` (or `origin-https` fallback) to preserve recovery points.
- Keep branch marked as draft in PR status while checks are incomplete.
- Force-push is acceptable after rebases on personal branches, with caution.

Ready branch rules:

- Ensure branch is synced with integration and checks pass before final push.
- Prefer non-disruptive updates once review is active; avoid unnecessary history rewrites.
- If force-push is required, communicate clearly in the PR thread.

## 5) Post-merge cleanup checklist (branch + worktree)

After a branch is merged:

1. Confirm merged status on the integration branch.
2. Remove the local topic branch:
   - `git branch -d <branch-name>`
3. Remove the remote topic branch (if policy allows):
   - `git push origin --delete <branch-name>`
4. Remove the dedicated worktree:
   - `git worktree remove <worktree-path>`
5. Prune stale worktree and remote metadata:
   - `git worktree prune`
   - `git fetch --all --prune`
6. Return to your default worktree and verify clean state:
   - `git status --short`

If a branch is not merged but work is abandoned, delete with explicit force options only after confirming no recovery is needed.

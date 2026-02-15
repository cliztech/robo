# Git Worktree Workflow

This guide standardizes how contributors use `git worktree` for parallel tasks while keeping branch ownership and cleanup predictable.

## Directory Naming Convention

Create all local worktrees under a single top-level folder named `worktrees/`.

- **Pattern:** `worktrees/<ticket>-<short-name>`
- **Examples:**
  - `worktrees/1234-fix-schedule-validation`
  - `worktrees/ops-88-update-release-checks`

Naming rules:

1. Prefix with a ticket/issue identifier when available (`1234`, `OPS-88`, etc.).
2. Use a short kebab-case task label.
3. Keep names stable for the life of the task branch.

## Standard Commands

Run these from the main repository root (the primary checkout).

### Add a new worktree

```bash
git fetch origin
git worktree add worktrees/<ticket>-<short-name> -b <branch-name> origin/main
```

Example:

```bash
git worktree add worktrees/1234-fix-schedule-validation -b feat/1234-schedule-validation origin/main
```

### List active worktrees

```bash
git worktree list
```

### Remove a merged/unused worktree

```bash
git worktree remove worktrees/<ticket>-<short-name>
```

If the working tree is clean but metadata persists, prune stale entries:

```bash
git worktree prune
```

## Branch Ownership Rules

Each worktree has exactly one owned branch.

1. **One branch per worktree:** do not reuse a worktree for multiple branches.
2. **One owner branch checked out:** keep the linked branch checked out only in its dedicated worktree.
3. **Do not commit on `main` in feature worktrees:** feature worktrees should track `feat/*`, `fix/*`, or equivalent task branches.
4. **Do not share unfinished branches across multiple local worktrees.**

## Sync / Rebase Strategy with Main Integration Branch

Treat `main` as the integration branch.

Recommended routine before opening/updating a PR:

```bash
git fetch origin
cd worktrees/<ticket>-<short-name>
git rebase origin/main
```

If your team prefers merge commits, use `git merge origin/main` instead, but stay consistent within the same task branch.

After rebasing, run your checks, then push with lease when needed:

```bash
git push --force-with-lease
```

## Cleanup Policy After Merge

After the PR is merged:

1. Return to the main checkout.
2. Delete the local task branch from its worktree.
3. Remove the worktree directory.
4. Prune stale worktree metadata.
5. Delete the remote branch (if policy allows).

Example cleanup:

```bash
git checkout main
git pull --ff-only origin main
git branch -d <branch-name>
git worktree remove worktrees/<ticket>-<short-name>
git worktree prune
git push origin --delete <branch-name>
```

## Safety Checklist (Prevent Wrong-Branch Commits)

Before every commit and push:

- [ ] Run `git rev-parse --abbrev-ref HEAD` and confirm expected task branch.
- [ ] Run `git status --short` and confirm only intended files are modified.
- [ ] Run `git worktree list` and confirm you are in the expected path.
- [ ] Confirm branch naming matches task ownership (`feat/<ticket>-...`, `fix/<ticket>-...`, etc.).
- [ ] Rebase/merge from `origin/main` before final push.
- [ ] Review `git diff --name-only` before committing.

Optional prompt hardening:

- Add shell prompt info that shows current branch and path.
- Use pre-commit hooks for branch naming or protected-branch checks.

# Agent Execution Commands Playbook

Short, runnable command sequences for execution workflows, plus an operational matrix for all DGN-DJ teams (managers, subagents, tools, skills, personalities, tech stack, and trusted references).

## Canonical BMAD startup policy (Codex/Gemini/Jules)

Use this as the single startup snippet for repository-level agent bootstrap instructions.

> Use BMAD as the default execution framework for this repository.
> Load `_bmad/_config/bmad-help.csv` at session start.
> Match command/workflow first, then fall back to free-form execution.
> Treat `_bmad/` as the workflow source of truth.

### Quick verification checklist

- [ ] Given request X, expected BMAD command Y is selected.
- [ ] If no match exists, fallback path is used.

### Slash-command normalization

When users issue short slash commands (for example, `/bmad build`) that are not literal entries in `_bmad/_config/bmad-help.csv`, normalize to the closest canonical BMAD command before execution.

| Incoming slash command | Canonical BMAD command | Rationale |
| --- | --- | --- |
| `/bmad build` | `bmad-bmm-quick-dev` | Implies immediate implementation/delivery intent in a one-off flow. |

If no safe mapping is obvious, run `bmad-help` behavior and present nearest valid commands from `_bmad/_config/bmad-help.csv`.

## 0) Fast start and repository sanity checks

```bash
# Always start with repository context
pwd
git status --short
git branch --show-current

# Confirm this playbook and core docs are present
rg -n "agent_execution_commands.md|AGENTS.md|CONTRIBUTING.md" AGENTS.md CONTRIBUTING.md
```

Expected output snippet:

```text
/workspace/robo
main
AGENTS.md:150:| [`docs/operations/agent_execution_commands.md`]...
CONTRIBUTING.md:10:4. Read [`docs/operations/agent_execution_commands.md`]...
```

Failure recovery notes:

- If branch is detached, create or checkout a branch before editing.
- If paths are missing, pull latest main and retry.

---

## 0.5) BMAD route-to-command matrix (canonical selection guide)

Use this table to map the intake route (`QA`, `Proposal`, `Change`) to the correct BMAD-style command flow in this playbook.

| Route | Primary intent | BMAD command flow (this playbook) | Trigger examples (request phrasing → selected command) |
| --- | --- | --- | --- |
| `QA` | Analysis + validation without implementation | `2) Parallel subagent analysis workflow` → `6) Self-healing + self-research + self-critique loop` → `7) Final verification commands` | "Audit this spec for gaps and risks" → Section 2 analysis packets + Section 6 checks; "Run readiness checks before we start implementation" → Section 6 + Section 7; "Do a read-only quality review of this plan" → Section 2 risk/research lanes |
| `Proposal` | PRD/architecture/epic definition and planning artifacts | `1) Non-trivial task planning kickoff` → `2) Parallel subagent analysis workflow` (optional evidence lanes) → `3) Draft PR lifecycle` | "Draft a PRD and architecture outline for feature X" → Section 1 plan artifact, then Section 3 draft PR; "Write epics and dependency plan for next release" → Section 1 + Section 2 dependency/research packet; "Propose a rollout approach with risks" → Section 1 + Section 2 + Section 3 |
| `Change` | Implement scoped changes with delivery/review workflow | `1) Non-trivial task planning kickoff` → implementation workstream → `6) Self-healing + self-research + self-critique loop` → `7) Final verification commands` → `3) Draft PR lifecycle` | "Implement this bug fix" → Section 1 plan + Section 6/7 validation + Section 3 PR; "Ship this doc/config update" → Section 1 for scope + Section 7 checks; "Complete sprint story and prep review" → Section 1 planning + Section 3 review lifecycle |

### Tie-break rules when multiple BMAD flows match

1. **Prefer prerequisite phases first:** run the lowest-sequence valid phase before later phases (`1` before `2`, `2` before `3`, etc.).
2. **If request mixes route intent, anchor to the highest-risk requirement:**
   - Validation-heavy language ("audit", "readiness", "review") defaults to `QA` command order.
   - Spec-heavy language ("proposal", "PRD", "architecture", "epic") defaults to `Proposal` order.
   - Delivery language ("implement", "fix", "ship") defaults to `Change` order.
3. **Never skip mandatory verification:** whenever edits happen, include Sections `6` and `7` before PR readiness in Section `3`.
4. **Escalate only after prerequisites are satisfied:** if uncertain between two commands, execute the earlier prerequisite command and re-evaluate with its output.

---

## 1) Non-trivial task planning kickoff

Use this flow when work has multiple steps, dependencies, or risks that need tracking.

### Commands

```bash
# 1) Create a dated plan artifact
mkdir -p docs/operations/plans
PLAN_FILE="docs/operations/plans/$(date +%F)-task-plan.md"
cp docs/operations/templates/task_plan_template.md "$PLAN_FILE" 2>/dev/null || cat > "$PLAN_FILE" <<'PLANBLOCK'
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
PLANBLOCK

# 2) Fill scope + steps
${EDITOR:-vi} "$PLAN_FILE"

# 3) Commit planning checkpoint
git add "$PLAN_FILE"
git commit -m "docs: add task plan artifact for <task-name>"

# 4) Update checkboxes and commit progress checkpoints
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

### Failure recovery notes

- If the template copy fails, inline fallback still creates a valid plan.
- If `git commit` says `nothing to commit`, verify saved edits with `git status --short`.
- If scope changes mid-task, append a `## Scope Change Log` section instead of rewriting old decisions.

---

## 2) Parallel subagent analysis workflow

Use when independent analysis threads can run concurrently and then be merged.

### Commands

```bash
# 1) Create task packet root
TASK_ROOT="docs/operations/task_packets/$(date +%F)-<task-name>"
mkdir -p "$TASK_ROOT"/{packets,results,merged}

# 2) Create packet stubs for each analysis lane
cat > "$TASK_ROOT/packets/01-research.md" <<'P1'
# Packet: Research
## Question
## Inputs
## Constraints
## Deliverable
P1

cat > "$TASK_ROOT/packets/02-risk-review.md" <<'P2'
# Packet: Risk Review
## Question
## Inputs
## Constraints
## Deliverable
P2

cat > "$TASK_ROOT/packets/03-validation.md" <<'P3'
# Packet: Validation
## Question
## Inputs
## Constraints
## Deliverable
P3

# 3) Collect outputs (replace echo with real executions)
echo "research findings" > "$TASK_ROOT/results/01-research.out.md"
echo "risk findings" > "$TASK_ROOT/results/02-risk-review.out.md"
echo "validation findings" > "$TASK_ROOT/results/03-validation.out.md"

# 4) Merge in deterministic order
cat "$TASK_ROOT/results/01-research.out.md" \
    "$TASK_ROOT/results/02-risk-review.out.md" \
    "$TASK_ROOT/results/03-validation.out.md" \
  > "$TASK_ROOT/merged/combined-analysis.md"

# 5) Commit packet + merged artifact
git add "$TASK_ROOT"
git commit -m "docs: add parallel analysis packet and merged results for <task-name>"
```

### Expected output snippets

```text
$ git commit -m "docs: add parallel analysis packet and merged results for prompt-upgrade"
[feature/prompt-upgrade 5d6e7f8] docs: add parallel analysis packet and merged results for prompt-upgrade
 7 files changed, 68 insertions(+)
```

### Failure recovery notes

- If one lane fails, keep a result file with failure notes so merge remains traceable.
- If sensitive data appears, redact before commit and document redactions in merged output.

---

## 3) Draft PR lifecycle

Use for long-running work that should be visible before final review.

### Commands

```bash
# 1) Push and open draft PR
git push -u origin <branch-name>
gh pr create \
  --draft \
  --title "docs: <short-title>" \
  --body-file .github/pull_request_template.md

# 2) Update PR checkpoints
gh pr edit <pr-number> --body-file /tmp/pr-body-updated.md
gh pr comment <pr-number> --body "Checkpoint: completed validation pass and updated risks section."

# 3) Review gate checks
gh pr checks <pr-number>
gh pr view <pr-number> --json reviewRequests,reviews,state

# 4) Mark ready only after green gates
gh pr ready <pr-number>
```

### Expected output snippets

```text
$ gh pr create --draft --title "docs: add execution command playbook" --body-file .github/pull_request_template.md
https://github.com/<org>/<repo>/pull/123

$ gh pr ready 123
✓ Pull request <org>/<repo>#123 is marked as "ready for review"
```

### Failure recovery notes

- If `gh` is unauthenticated, run `gh auth login` and retry.
- If checks fail, keep PR in draft and post remediation steps with command output.

---

## 4) Git worktree lifecycle

Use separate worktrees for concurrent changes without constant branch switching.

### Commands

```bash
# 1) Create worktree from main
mkdir -p ../worktrees
git worktree add ../worktrees/<branch-name> -b <branch-name> origin/main

# 2) Verify and sync
git worktree list
cd ../worktrees/<branch-name>
git fetch origin
git rebase origin/main

# 3) Finish and remove
cd /workspace/robo
git worktree remove ../worktrees/<branch-name>

# 4) Prune stale metadata and local branch
git worktree prune
git branch -d <branch-name>
```

### Expected output snippets

```text
$ git worktree add ../worktrees/docs-agent-playbook -b docs-agent-playbook origin/main
Preparing worktree (new branch 'docs-agent-playbook')
branch 'docs-agent-playbook' set up to track 'origin/main'.
HEAD is now at abc1234 docs: refine contribution guide
```

### Failure recovery notes

- If removal fails due to uncommitted files, commit/stash in the worktree first.
- If branch delete says `not fully merged`, inspect `git log --oneline main..<branch-name>`.

---

## 5) Full team execution matrix (managers, subagents, tools, skills, personalities, stack, references)

Use this matrix to ensure every workflow includes the right people/agents, toolchain, and evidence sources.

| Department | Manager role | Subagents | Core tools | Required skills / behaviors | Personality defaults | Tech stack focus | Reliable references |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DevOps | Project Coordinator / Release Manager | CI/CD Pipeline, Infrastructure, Release Manager | `git`, `gh`, GitHub Actions, Docker, Python | Stage gates, rollback-ready, auditable changes | Calm, checklist-first, risk-aware | CI pipelines, deployment manifests, ops scripts | GitHub Actions docs, Docker docs, Python docs |
| SecOps | Compliance Lead | Vulnerability Scanner, Secrets Auditor, Compliance Agent | `pip-audit`, `bandit`, `gitleaks`, policy docs | Zero-secrets policy, severity triage, evidence logging | Skeptical, strict, high-signal | Dependency graph, secrets scanning, policy-as-code | OWASP, NIST CSF, CVE/NVD, CISA advisories |
| Design | Design Lead | UI/UX, Brand Consistency, Accessibility Auditor | Figma, design tokens, WCAG checkers | Accessibility-first, brand consistency | Empathetic, clarity-first | UX specs, interaction models, copy tone | W3C WCAG/WAI, Material Design, Nielsen Norman Group |
| Research | Research Lead | Trend Analyst, Competitive Intel, Tech Scout | notebooks, spreadsheets, source tracker | Source citation, comparative analysis | Curious, hypothesis-driven | market scans, model/vendor evaluations | FCC/OFCOM updates, arXiv, industry reports, vendor docs |
| Management | Program Manager | Sprint Planner, Dependency Tracker | roadmap docs, issue trackers, burndown boards | prioritization, dependency mapping, release controls | Decisive, cross-team | planning docs, release scope controls | Agile playbooks, team metrics dashboards |
| QA | QA Lead | Test Generator, Regression Watcher, Performance Profiler | `pytest`, coverage tools, perf profilers | test evidence, baseline comparison, reproducibility | Adversarial-but-fair | automated tests, integration checks, perf traces | pytest docs, Playwright docs, perf engineering handbooks |
| Brutal Review | Review Lead | Code Critic, Doc Reviewer, UX Auditor | review checklists, lint tools, rubric sheets | specific actionable critique, no vague approvals | Direct, uncompromising, fair | code/docs quality rubrics | markdownlint docs, style guides, ADR patterns |
| Bug | Incident / Bug Manager | Bug Triager, RCA Analyst, Hotfix Coordinator | issue trackers, RCA templates, logs | severity routing, 5-whys, fix verification | Urgent, structured | incident timelines, hotfix patches | SRE workbook, postmortem guides |
| AI Improvement | AI Product Lead | Model Evaluator, Prompt Optimizer, Training Pipeline | eval harnesses, prompt repos, scorecards | rubric scoring, A/B discipline, guardrails | Experimental, metric-centered | prompts, eval datasets, quality benchmarks | OpenAI docs, Anthropic docs, evaluation papers |
| Radio Broadcasting Consulting | Broadcast Director | Program Director, Broadcast Compliance, Stream Reliability | schedulers, compliance checklists, stream monitors | legal/safety compliance, uptime focus | On-air safe, listener-centric | scheduling, stream reliability, content policy | FCC/OFCOM guidance, EBU resources, broadcast ops docs |

### Command sequence: generate team task packets in one pass

```bash
OPS_ROOT="docs/operations/team_packets/$(date +%F)-<initiative>"
mkdir -p "$OPS_ROOT"/{devops,secops,design,research,management,qa,brutal_review,bug,ai_improvement,broadcasting}

for team in devops secops design research management qa brutal_review bug ai_improvement broadcasting; do
  cat > "$OPS_ROOT/$team/packet.md" <<'PACKET'
# team packet
## Goal
## Inputs
## Constraints
## Required checks
## Output artifact
PACKET
done

git add "$OPS_ROOT"
git commit -m "docs: add cross-team execution packets for <initiative>"
```

Expected output snippet:

```text
$ git commit -m "docs: add cross-team execution packets for autonomy-v2"
[feature/autonomy-v2 8b7a6c2] docs: add cross-team execution packets for autonomy-v2
 10 files changed, 70 insertions(+)
```

Failure recovery notes:

- If one team packet is incomplete, leave TODO markers and keep commit atomic.
- If team naming changes, keep folder aliases and map them in a `README.md` inside the packet root.

---

## 6) Self-healing + self-research + self-critique loop (run every generation)

Run this loop at every major generation boundary (plan draft, implementation draft, final output draft).

### A) Self-healing checks (consistency and recoverability)

```bash
# Repo integrity and diff sanity
git status --short
git diff --name-only

# Validate links to key docs are intact
rg -n "agent_execution_commands.md" AGENTS.md CONTRIBUTING.md

# If JSON files changed, validate syntax
# python -m json.tool config/schedules.json >/dev/null
# python -m json.tool config/prompt_variables.json >/dev/null
```

### B) Self-research checks (evidence quality)

```bash
# Ensure this playbook contains expected evidence headers
rg -n "Reliable references|Failure recovery notes|Expected output snippets" docs/operations/agent_execution_commands.md

# Optional: capture source list for review packets
cat > /tmp/reference_checklist.txt <<'REFS'
- Confirm at least one standards body source (OWASP/W3C/FCC/NIST)
- Confirm at least one vendor/tool official docs source
- Confirm at least one internal repository source
REFS

cat /tmp/reference_checklist.txt
```

### C) Self-critique checks (quality gate before handoff)

```bash
# 5-point quality gate quick rubric
cat > /tmp/self_critique_template.md <<'RUBRIC'
# Self-critique rubric
- Scope accuracy (1-5):
- Technical correctness (1-5):
- Operational safety (1-5):
- Evidence clarity (1-5):
- Handoff readiness (1-5):
RUBRIC

cat /tmp/self_critique_template.md
```

Failure recovery notes:

- If any gate scores below 4/5, revise before commit.
- If evidence is weak, add references and rerun self-research checks.
- If commands are not runnable in the environment, annotate constraints near the command block.

---

## 7) Final verification commands (before commit/PR)

```bash
git status --short
git diff --name-only
git log --oneline -1
```

Optional PR checks:

```bash
# If GitHub CLI is configured
gh pr checks <pr-number>
gh pr view <pr-number> --json state,reviewDecision
```

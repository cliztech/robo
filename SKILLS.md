# Skills Registry

This file defines reusable, trigger-based skills for the RoboDJ repository.

## Usage Rules
- Choose the smallest skill set that fully covers the request.
- Execute skills in an explicit order.
- Keep context lean: load only the sections needed for the active task.

## Available Skills

### scope-resolver
- **Purpose:** Determine which instruction files apply to the requested change.
- **Trigger:** Any task that targets specific files/directories.
- **Inputs:** Candidate paths, user request.
- **Steps:**
  1. Locate nearest `AGENTS.md` for each target path.
  2. Build precedence chain from root to deepest scope.
  3. Extract constraints and required output format.
- **Output:** Scope map listing effective rules by path.
- **Guardrails:** Treat deeper instruction files as higher precedence.

### intake-router
- **Purpose:** Route requests into QA, Change, or Proposal pipeline modes.
- **Trigger:** New request or changed scope during execution.
- **Inputs:** User intent, constraints, repository type.
- **Steps:**
  1. Parse requested outcome.
  2. Detect forbidden actions (e.g., no edits in QA mode).
  3. Assign route and required deliverables.
- **Output:** Route decision + rationale.
- **Guardrails:** Do not transition to Change mode without explicit implementation intent.

### qa-issue-emitter
- **Purpose:** Report actionable issues in required issue + task-stub style.
- **Trigger:** QA review requests asking for findings/suggestions.
- **Inputs:** Static findings and evidence.
- **Steps:**
  1. State each issue succinctly.
  2. Immediately add a task stub with implementation instructions.
  3. Include module paths, key functions, and search anchors.
- **Output:** Ordered findings with one task stub per issue.
- **Guardrails:** Never emit actionable fix plans outside task-stub blocks.

### safe-config-editor
- **Purpose:** Safely update runtime config files.
- **Trigger:** Changes under `config/` involving JSON/text files.
- **Inputs:** Target config path and desired value changes.
- **Steps:**
  1. Confirm file type is editable (`.json`, `.py`, `.md`, `.txt`).
  2. Apply minimal diff.
  3. Validate syntax and preserve formatting conventions.
- **Output:** Updated config plus summary of edited keys.
- **Guardrails:** Never edit `.db`, `.key`, or binary artifacts.

### docs-pipeline-designer
- **Purpose:** Create or refine pipeline documentation for multi-agent operations.
- **Trigger:** Requests for architecture/process design.
- **Inputs:** Existing docs, governance requirements.
- **Steps:**
  1. Define role model and stage gates.
  2. Add decision routing and failure handling.
  3. Provide templates for handoff artifacts.
- **Output:** Documentation under root docs or `.agent/` scaffolding.
- **Guardrails:** Keep guidance deterministic and repository-specific.

### pr-writer
- **Purpose:** Generate structured PR titles/bodies for repository changes.
- **Trigger:** Any completed change set ready for review.
- **Inputs:** Commit diff, impacted files, verification notes.
- **Steps:**
  1. Compose concise Conventional Commit-aligned title.
  2. Summarize user-visible changes.
  3. List validation commands and limitations.
- **Output:** PR title and body suitable for direct submission.
- **Guardrails:** Exclude secrets and avoid unverifiable claims.

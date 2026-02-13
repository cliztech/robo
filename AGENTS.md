# Repository Guidelines

> **DGN-AirWaves** — AI-powered radio automation platform
> Python 3.x · PyInstaller · SQLite · JSON config · Windows desktop

## Scope

These instructions apply to the entire repository unless a deeper `AGENTS.md` overrides them.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Python 3.x (bundled via PyInstaller) | Compiled `.exe` distribution |
| Data | SQLite (`settings.db`, `user_content.db`) | Read-only for agents |
| Config | JSON (`schedules.json`, `prompt_variables.json`) | Editable with backup |
| AI Engine | LLM-based content generation, multi-agent banter | See `backend/` modules |
| Platform | Windows desktop | Launcher uses elevated privileges |

## Commands
>
> ⚡ Put commands early — agents reference these often.

| Action | Command | Notes |
|--------|---------|-------|
| **Run app** | `.\RoboDJ_Launcher.bat` | Resolves paths relative to launcher; elevated when needed |
| **Run directly** | `.\RoboDJ Automation.exe` | Skips launcher wrapper |
| **Inspect DB** | `cd config && python inspect_db.py` | Read-only schema inspection |
| **Check JSON** | `python -m json.tool config/schedules.json` | Validate JSON syntax |
| **Git status** | `git status --short` | Quick changed-file overview |
| **Diff check** | `git diff --name-only` | List modified files before commit |

## Project Structure & Module Organization

```
robo/
├── RoboDJ Automation.exe          # Main executable (DO NOT EDIT)
├── RoboDJ_Launcher.bat            # Launcher script
├── AGENTS.md                      # This file (repo-wide agent rules)
├── SKILLS.md                      # Reusable skill definitions
├── backend/                       # Python source modules
│   ├── content_engine.py          # AI content generation
│   ├── agents/                    # Multi-agent system
│   └── ...
├── config/                        # Runtime state & user config
│   ├── settings.db                # SQLite (read-only for agents)
│   ├── user_content.db            # SQLite (read-only for agents)
│   ├── schedules.json             # Editable JSON config
│   ├── prompt_variables.json      # Editable JSON config
│   ├── prompts/                   # LLM prompt templates
│   ├── scripts/                   # Utility scripts
│   ├── music_beds/                # Audio assets
│   ├── logs/                      # Runtime logs
│   ├── cache/                     # Temp cache
│   └── backups/                   # Pre-edit backups
├── RoboDJ Automation.exe_extracted/  # PyInstaller extraction (REFERENCE ONLY)
└── docs/                          # PDF/MD documentation
```

## Multi-Agent Pipeline

Use this stage-gated flow for all requests:

### 1. Intake Agent

- **Role:** Classify and route incoming requests
- **Responsibilities:**
  - Classify request type: QA review, docs/config change, implementation, or architecture proposal
  - Resolve scope by reading nearest `AGENTS.md` files
  - Select relevant skill entries from `SKILLS.md`
- **Completion gate:** Scope + constraints + applicable skills identified

### 2. Planner Agent

- **Role:** Design minimal, safe execution plans
- **Responsibilities:**
  - Build a minimal plan with constraints and expected artifacts
  - Ensure each plan step is within allowed scope
  - Flag any operations that require "Ask first" approval
- **Completion gate:** Every step maps to allowed operations

### 3. Executor Agent

- **Role:** Perform scoped changes with precision
- **Responsibilities:**
  - Perform only scoped changes
  - Create backups before modifying config files
  - Log all changes for the Verifier
- **Completion gate:** All changes remain in scope

### 4. Verifier Agent

- **Role:** Validate correctness and compliance
- **Responsibilities:**
  - Run only checks allowed by the active task constraints
  - Confirm formatting requirements and security constraints
  - Validate JSON syntax after config edits
- **Completion gate:** Requested checks/output requirements satisfied

### 5. Handoff Agent

- **Role:** Summarize and close the loop
- **Responsibilities:**
  - Summarize outcomes, touched files, validation done, and follow-ups
  - Generate PR body if applicable
- **Completion gate:** User request explicitly answered

## Boundaries

> 🛡️ Three-tier boundary system — the most effective pattern from [2,500+ repos](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/).

### ✅ Always Do

- Read-only inspection of any repository file
- Edit `.json`, `.py`, `.md`, `.txt` config files (with backup first)
- Use Conventional Commit format for all commits
- Keep commits scoped to configuration/documentation/scripts
- Run `python -m json.tool` to validate JSON after edits
- Preserve formatting conventions in edited files

### ⚠️ Ask First

- Adding new scripts to `config/scripts/`
- Modifying `schedules.json` or `prompt_variables.json` structure (not values)
- Changes to `backend/` Python modules
- Adding or removing dependencies
- Modifying CI/CD or deployment configuration
- Major restructuring of any existing document

### 🚫 Never Do

- Edit `.exe` files (`RoboDJ Automation.exe`)
- Edit `.db` files (`settings.db`, `user_content.db`) directly
- Edit or share `.key` files (`secret.key`, `secret_v2.key`)
- Commit secrets, API keys, or credentials
- Modify `RoboDJ Automation.exe_extracted/` (reference only)
- Remove files without explicit user approval

## Route Selection

| Route | Purpose | Agent Behavior |
|-------|---------|---------------|
| **QA** | Read-only inspection | No file edits; findings + task stubs only |
| **Change** | Apply scoped edits | Small commits; avoid binaries; backup first |
| **Proposal** | Design/spec output | Documentation only; no implementation unless asked |

## Coding Style & Naming Conventions

**Python:**

```python
# ✅ Good — descriptive names, type hints, error handling
def load_schedule(config_path: str) -> dict:
    """Load and validate the schedule configuration."""
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config not found: {config_path}")
    with open(config_path, 'r') as f:
        return json.load(f)

# ❌ Bad — vague names, no types, no error handling
def load(p):
    return json.load(open(p))
```

**Conventions:**

- 4-space indentation for Python
- `lower_snake_case` for JSON keys and Python functions
- `PascalCase` for Python classes
- `UPPER_SNAKE_CASE` for constants
- Keep scripts small and task-focused
- Concise markdown sections with task-focused headings

## Commit & Pull Request Guidelines

- Use Conventional Commit style: `chore:`, `docs:`, `fix:`, `feat:`
- Keep commits scoped to configuration/documentation/scripts
- PR bodies should include:
  - A short summary of changes
  - Any config files touched
  - Validation commands run
  - Screenshots only for UI behavior changes

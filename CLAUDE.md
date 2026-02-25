# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For the full agent instruction set, see [`AGENTS.md`](AGENTS.md). This file provides Claude-specific guidance only.

## Project Overview

This repository acts as the **Runtime Distribution & Core Engine** for **DGN-DJ by DGNradio** (also referred to as AetherRadio in newer docs). It is a hybrid repository containing:
1.  **Legacy Core**: A compiled Windows executable (`RoboDJ Automation.exe`) and launcher.
2.  **Modern Backend**: Python/FastAPI services (`backend/`) that drive AI autonomy and scheduling.
3.  **React Frontend**: Source code (`src/`) for the next-generation UI (build system currently separate).

## Commands

### Development (Python/Backend)
| Action | Command | Notes |
| ------ | ------- | ----- |
| **Build** | `make build` | Compiles Python modules (`dgn-airwaves`, `dgn-robo-rippa`) and packages configs |
| **Lint/QA** | `make qa` | Runs YAML/Markdown linting and Python syntax checks |
| **Test** | `pytest backend/tests` | Runs backend unit and integration tests |
| **Run Backend** | `uvicorn backend.app:app --reload` | Starts the FastAPI autonomy service locally |
| **Validate** | `make check` | Validates architecture schemas and modules |
| **Run Stubs** | `make run-airwaves` | Runs the Airwaves module stub |

### Runtime (Windows Production)
| Action | Command | Notes |
| ------ | ------- | ----- |
| **Run App** | `.\RoboDJ_Launcher.bat` | Portable path resolution; elevated when needed |
| **Run Binary** | `.\RoboDJ Automation.exe` | Direct execution (skips launcher wrapper) |
| **Inspect DB** | `python config/inspect_db.py` | Read-only schema inspection of runtime SQLite DBs |
| **Check Config** | `python config/validate_config.py` | Validates JSON configuration schemas |

## Architecture

See `AGENTS.md` → **Project Structure & Module Organization** for the full tree.

- **Backend** (`backend/`): Python FastAPI services handling autonomy policies, scheduling logic, and secret integrity.
- **Modules** (`dgn-*/`): Domain Graph Nodes. Python packages containing specialized logic (e.g., `dgn-airwaves`, `dgn-robo-rippa`).
- **Frontend** (`src/`): React/Next.js source code for the AetherRadio UI. *Note: `package.json` is currently missing from root; this is source-only.*
- **Configuration** (`config/`): Runtime state, JSON autonomy profiles, prompt templates, and SQLite databases.
- **Contracts** (`contracts/`): API definitions and redaction rules.


## Claude Code Style Plugins

Claude Code may use optional style plugins when explicitly requested by the user.

### Available Plugin: Ralph Wiggum

- Path: `.claude/style-plugins/ralph-wiggum.md`
- Plugin ID: `style.ralph_wiggum`
- Trigger examples: `/ralph wiggum style`, `use Ralph Wiggum tone`
- Scope: narration tone only; engineering output remains conventional and production-grade.

## Key Rules

1.  **Read `AGENTS.md` first** — it defines the multi-agent pipeline, boundaries, and coding style.
2.  **Read `SKILLS.md`** — it defines reusable skill definitions with triggers and boundaries.
3.  **Never edit** `.exe`, `.db`, or `.key` files.
4.  **Always back up** config files before editing.
5.  **Use Conventional Commits** — `chore:`, `docs:`, `fix:`, `feat:`
6.  Keep changes scoped to configuration, documentation, and scripts unless explicitly working on the Python backend.

---

## Team Dispatch Rules

> When Claude receives a request, identify the relevant agent team(s) from `AGENTS.md` → **Agent Team Organization** before planning execution.

### Quick Dispatch Lookup

| Request Pattern | Primary Team | Supporting Teams |
| --------------- | ------------ | ---------------- |
| Code review, PR feedback | Brutal Review & Feedback | QA |
| Security audit, secrets scan | SecOps | DevOps |
| Config file changes | *Use `safe-config-editor` skill* | QA (validation) |
| Bug report or crash analysis | Bug | Incident Response, DevOps |
| UI/UX question or spec | Design | Brutal Review (UX audit) |
| Scheduling or programming | Radio Broadcasting Consulting | Monetization & Ads |
| Content quality issues | Content Moderation | AI Improvement |
| Performance concern | QA (Performance Profiler) | DevOps |
| Listener data or analytics | Radio Trend & Analysis | Research |
| Release or deploy | DevOps (Release Manager) | QA, SecOps |
| System outage or alert | Incident Response | DevOps, Bug |
| Strategy or market question | Research | Radio Trend & Analysis |
| Prompt or model quality | AI Improvement | Content Moderation |
| Ad breaks or revenue | Monetization & Ads | Radio Broadcasting Consulting |
| Sprint planning or roadmap | Management | All teams |

### Multi-Team Coordination

When a request spans multiple teams:

1.  **Identify the primary team** — the one owning the deliverable.
2.  **Identify supporting teams** — those providing inputs or validations.
3.  **Follow the handoff protocol** defined in each team's section in `AGENTS.md`.
4.  **Route through Management** if 3+ teams are involved or cross-team conflicts arise.

---

## Claude-Specific Strengths

Claude excels at these team roles due to its analytical and reasoning capabilities:

| Strength Area | Best-Fit Teams | Why |
| ------------- | -------------- | --- |
| **Deep code analysis** | Brutal Review, Bug, QA | Thorough line-by-line analysis and pattern recognition |
| **Security reasoning** | SecOps | Ability to trace data flows and identify exposure patterns |
| **Documentation quality** | Brutal Review (Doc Reviewer), Design | Strong markdown and technical writing skills |
| **Root cause analysis** | Bug (Root Cause Analyst) | Systematic 5-whys reasoning and cross-reference tracing |
| **Content generation rules** | AI Improvement, Content Moderation | Understanding of persona configurations and tone calibration |
| **Strategic analysis** | Research, Radio Trend & Analysis | Structured analytical frameworks and competitive assessment |

---

## Radio Broadcasting Context

DGN-DJ is an **AI-powered online radio automation platform**. When working with radio-specific teams, keep these domain concepts in mind:

-   **Dayparts:** Morning (6-10), Midday (10-14), Afternoon (14-18), Evening (18-22), Overnight (22-6)
-   **Clock-wheel:** Repeating hour template defining segment order (see `docs/scheduler_clockwheel_spec.md`)
-   **Legal IDs:** Station identification required at regular intervals for regulatory compliance
-   **Dead-air detection:** System that triggers safe-mode playlists when no audio is detected
-   **Autonomy modes:** Five operating levels from Manual Assist to Lights-Out Overnight (see `docs/autonomy_modes.md`)
-   **Persona ops:** AI host persona management with A/B testing and rubric scoring (see `PERSONA_OPS.md`)

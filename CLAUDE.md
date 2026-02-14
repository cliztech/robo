# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For the full agent instruction set, see [`AGENTS.md`](AGENTS.md). This file provides Claude-specific guidance only.

## Project Overview

This repository is the runtime distribution for **DGN-DJ by DGNradio**, an AI-powered radio automation platform. It contains compiled executables, Python backend modules, configuration files, and documentation.

- **Primary Executable**: `RoboDJ Automation.exe` (legacy binary name — brand is DGN-DJ)
- **Launcher**: `RoboDJ_Launcher.bat` (runs the executable with elevated privileges)
- **Backend Source**: `backend/` — Python modules for AI content generation and multi-agent system
- **Configuration**: `config/` — JSON configs, SQLite databases, prompt templates, scripts
- **Platform**: Windows desktop

## Commands

| Action | Command | Notes |
|--------|---------|-------|
| **Run app** | `.\RoboDJ_Launcher.bat` | Portable path resolution; elevated when needed |
| **Run directly** | `.\RoboDJ Automation.exe` | Skips launcher wrapper |
| **Inspect DB** | `python config/inspect_db.py` | Read-only schema inspection |
| **Validate config** | `python config/validate_config.py` | JSON schema validation |
| **Check JSON** | `python -m json.tool config/schedules.json` | Quick syntax check |

## Key Rules

1. **Read `AGENTS.md` first** — it defines the multi-agent pipeline, boundaries, and coding style.
2. **Read `SKILLS.md`** — it defines reusable skill definitions with triggers and boundaries.
3. **Never edit** `.exe`, `.db`, or `.key` files.
4. **Always back up** config files before editing.
5. **Use Conventional Commits** — `chore:`, `docs:`, `fix:`, `feat:`
6. Keep changes scoped to configuration, documentation, and scripts.

## Architecture

See `AGENTS.md` → **Project Structure & Module Organization** for the full tree.

Key directories:

- `backend/` — Python source (content engine, agents, models)
- `config/` — Runtime state, JSON configs, SQLite databases, prompt templates
- `docs/` — Specifications (autonomy modes, conversation orchestrator, etc.)
- `contracts/` — API contracts and redaction rules

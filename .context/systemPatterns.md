# System Patterns

## Architecture
- **Frontend:** Next.js 14 App Router (Server & Client Components)
- **Data Flow:** Unidirectional (Props/State -> Component -> API -> DB)
- **State Ownership:** Zustand (Global State), Context (Audio Engine)
- **Audio Engine:** Web Audio API (Client-Side), FFmpeg (Server-Side)
- **AI Integration:** Vercel AI SDK (Typed Interfaces), OpenAI (Generative Logic)

## Module Organization
- `backend/`: Python source (content engine, agents, models)
- `config/`: Runtime state, JSON configs, SQLite databases (read-only for agents)
- `contracts/`: API contracts and redaction rules
- `docs/`: Specifications and documentation
- `infra/`: Docker and cloud infrastructure definitions
- `src/`: Frontend source (components, hooks, pages)

## Code Laws
- **Early Returns:** Prefer early returns to deeply nested conditionals.
- **File Size:** Files should ideally be <200 lines. Break down complex components.
- **Single Responsibility:** One function/component per logical task.
- **Naming:** Descriptive names (`load_schedule` not `load`).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- **Backups:** Always backup `.json`, `.py`, `.md`, `.txt` config files before editing.
- **Testing:** Add tests for all new logic (`npm run test`).

## Boundaries
- **Always Do:**
  - Read-only inspection of any file.
  - Backup config files before editing.
  - Run `python -m json.tool` to validate JSON edits.
- **Ask First:**
  - Adding new scripts to `config/scripts/`.
  - Modifying `schedules.json` or `prompt_variables.json` structure.
  - Changes to `backend/` Python modules.
  - Adding dependencies.
- **Never Do:**
  - Edit `.exe`, `.db`, or `.key` files directly.
  - Commit secrets or API keys.
  - Remove files without explicit approval.

## Team Structure (AGENTS.md)
The system operates with specialized agent teams (DevOps, SecOps, Design, etc.). Refer to `AGENTS.md` for detailed role definitions and handoffs.

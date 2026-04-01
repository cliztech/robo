# Tech Stack Context

## Canonical runtimes
- Node.js 20.x for JS/Next.js subprojects.
- Python >=3.10 for backend/services and validation scripts.

## Core framework/tooling surface
- Next.js 15.5.10 + React 18 + TypeScript 5.
- Vite 5.4.8 for DJ console subtree.
- Express 4.21.2 + NATS 2.29.1 for service stack surfaces.

## Data and config
- SQLite files (`settings.db`, `user_content.db`) are runtime data and read-only for agents.
- JSON config (`config/schedules.json`, `config/prompt_variables.json`) is editable with validation and backups.

## Platform targets
- Vercel (web), Docker Compose (`radio-agentic`), Windows launcher/desktop distribution.

## Source anchors
- `AGENTS.md` (canonical constraints)
- `TECH_STACK.md` (expanded toolchain list)
- `docs/product-specs/environment-profiles.md`

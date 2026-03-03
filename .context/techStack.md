# Tech Stack

Canonical source for runtime ownership and versions: `docs/architecture/canonical_runtime_map.md`.

## Core Runtime
- **Node.js:** 20.x (primary JavaScript runtime)
- **Python:** >=3.10 (`dgn-airwaves` package compatibility)
- **Deployment targets:** Vercel (web studio), Windows desktop launcher flow, Docker Compose for `radio-agentic`

## Frontend Frameworks
- **Main App Framework:** Next.js 15.5.10 (App Router, API routes)
- **Main UI Library:** React 18 (root app dependency)
- **Subproject UI Runtime:** Vite 5.4.8 + React 18.3.1 (`apps/dj-console`)

## Backend & Data
- **Database:** Supabase (PostgreSQL, `pg_cron`, `vector`)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **Service APIs:** Express 4.21.2 (`radio-agentic/services/*`)
- **Messaging:** NATS 2.29.1 (`radio-agentic/services/*`)

## Audio Stack
- **Engine:** Web Audio API (AudioContext, Nodes, Analysers)
- **Processing:** FFmpeg/FFprobe (server-side), Howler.js (fallback)
- **Streaming:** Icecast 2.4+

## AI Stack
- **Models:** OpenAI API (`gpt-4o`, `gpt-4o-mini`)
- **Integration:** Vercel AI SDK

## Tooling
- **Language:** TypeScript 5.x (root + workspace)
- **Tests:** Vitest, React Testing Library, Playwright
- **Linting/Format:** ESLint, Prettier
- **Git Hooks:** Husky, lint-staged

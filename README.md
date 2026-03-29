# DGN-DJ by DGNradio - AI-Powered Radio Automation Platform

**Complete Implementation Guide for Development Team**

## 🎯 Project Overview

DGN-DJ by DGNradio is a next-generation AI-powered radio automation platform that enables users to run professional 24/7 internet radio stations with intelligent playlist generation, seamless crossfading, and real-time audio processing.

### Core Features

- **AI-Powered Automation**: Intelligent track selection and playlist generation
- **Professional Audio Engine**: Web Audio API with 5-band EQ, compression, and limiting
- **Seamless Crossfading**: Multiple crossfade algorithms with beat matching
- **Real-time Broadcasting**: Live streaming with Icecast integration
- **Smart Analytics**: Track performance, listener stats, and AI decision tracking
- **Modern UI**: Dark theme, drag-and-drop uploads, real-time visualizations

## 🏗️ Architecture

The following architecture reflects current stack ownership: the root Next.js app powers the studio/operator web experience, while backend services handle scheduling, status, and AI workflows.

```text
┌─────────────────────────────────────────────────────┐
│ Root Web App (Next.js 15.5.10 + React 18)              │
│ - App Router + route handlers                          │
│ - Server Components + Client Components                │
│ - Studio/operator UI (Tailwind + shadcn/ui)            │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ Audio Engine (Web Audio API)                        │
│ - AudioContext, Nodes, Analysers                    │
│ - Crossfade algorithms                              │
│ - EQ, Compression, Limiting                         │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ Backend Services (Python/FastAPI + Service APIs)    │
│ - Scheduler, autonomy policy, dashboard status APIs │
│ - Playlist + AI analysis APIs                        │
│ - Secret integrity + backend service orchestration   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ Platform Integrations                                │
│ - Supabase (Auth, data, storage)                     │
│ - OpenAI API + Vercel AI SDK                         │
│ - FFmpeg/FFprobe + Icecast runtime                   │
│ - Vercel + Docker Compose + Windows launcher targets │
└─────────────────────────────────────────────────────┘
```

## 📁 Documentation Files


1. [docs/launcher_entrypoints.md](docs/launcher_entrypoints.md) - Canonical launcher and executable entrypoint roles (canonical/shim/deprecated)
2. [docs/architecture/canonical_runtime_map.md](docs/architecture/canonical_runtime_map.md) - Runtime entrypoints, ownership boundaries, deployment targets, and artifact policy
3. [docs/operations/execution_index.md](docs/operations/execution_index.md) - Active track index, ownership, and status source mapping
4. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Complete folder structure
5. [TECH_STACK.md](TECH_STACK.md) - Technologies and dependencies
6. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete database schema
7. [PHASE_0_SETUP.md](PHASE_0_SETUP.md) - Environment setup (Day 1)
8. [PHASE_1_DATABASE.md](PHASE_1_DATABASE.md) - Database architecture (Day 2-3)
9. [PHASE_2_AUTH.md](PHASE_2_AUTH.md) - Authentication system (Day 4)
10. [PHASE_3_AUDIO_ENGINE.md](PHASE_3_AUDIO_ENGINE.md) - Audio engine (Day 5-7)
11. [PHASE_4_FILE_UPLOAD.md](PHASE_4_FILE_UPLOAD.md) - File upload system (Day 8-10)
12. [API_ROUTES.md](API_ROUTES.md) - API endpoints reference
## 🚀 Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm (recommended) or npm
- Docker Desktop (for local Supabase)
- FFmpeg with libopus, libmp3lame, libfdk-aac
- Supabase account
- OpenAI API key

### Installation

```bash
git clone <repository-url>
cd dgn-dj
pnpm install
cp .env.example .env.local
pnpm supabase db reset
pnpm dev
```

### Runtime commands (canonical)

- Main web studio: `npm run dev` (Node.js 20.x, Next.js 15.5.10).
- Windows desktop launcher (canonical): `./DGN-DJ_Launcher.bat`.
- Windows launcher shim (compatibility): `./RoboDJ_Launcher.bat` (delegates to canonical desktop launcher).
- Windows fullstack launcher (canonical): `./DGNDJ_Fullstack_Launcher.bat [dev|prod] [--port N]`.
- Windows legacy fullstack launcher (deprecated compatibility only): `./DGN-DJ_Fullstack_Launcher.bat`.
- DJ Console subproject: `npm --prefix apps/dj-console run dev`.
- Radio-agentic workspace: `pnpm --dir radio-agentic install && docker compose -f radio-agentic/docker-compose.yml up --build`.

See `docs/launcher_entrypoints.md` for launcher naming policy and `docs/architecture/canonical_runtime_map.md` for ownership/deployment boundaries.

### Backend Python environment (authoritative)

Use the compiled backend lock file for both local and CI installs:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install pip-tools
pip install -r backend/requirements.lock
pytest backend/tests -q
```

To update backend dependencies, edit `backend/requirements.in` and recompile:

```bash
pip-compile backend/requirements.in --output-file backend/requirements.lock
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📅 Development Timeline

- **Week 1-2**: Foundation (Phases 0-2)
- **Week 3**: Audio Core (Phase 3)
- **Week 4**: Media Management (Phase 4)
- **Week 5-8**: AI & feature buildout
- **Week 9-10**: Testing, polish, and launch

## 🧪 Testing

```bash
npm run test:ui      # fast deterministic DJ UI component tests
npm run test         # same UI suite for CI-friendly runs
npm run test:watch   # watch mode while iterating on DJ UI modules
npm run lint
```

## 📦 Deployment

- Primary web deployment target: **Vercel** (root Next.js app).
- Containerized services deployment target: **Docker Compose / container runtime** (`radio-agentic`).
- Desktop operator target: **Windows launcher + packaged executable workflow**.
- Packaged executables (`DGN-DJ Automation.exe`, `RoboDJ Automation.exe`) are intentionally distributed as external/bundled artifacts and are not tracked in git.

```bash
npm run build
npm run start
vercel --prod
```

## 🤝 Team Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Commit Convention

- `feat:` Add new functionality
- `fix:` Resolve bug
- `docs:` Update documentation
- `refactor:` Improve implementation
- `test:` Add/adjust tests

## 📄 License

Proprietary - All rights reserved.

Last Updated: February 14, 2026
Version: 1.0.0
Team: DGN-DJ Development Team

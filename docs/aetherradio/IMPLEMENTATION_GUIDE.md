# AetherRadio — Complete Implementation Guide

## Project Overview

AetherRadio is an AI-powered radio automation platform for running 24/7 internet radio stations with intelligent playlist generation, seamless crossfading, and real-time audio processing.

### Core Features

- AI-powered automation for track selection and scheduling
- Professional browser audio engine with EQ, compression, and limiting
- Multiple crossfade algorithms with optional beat-aware behavior
- Live broadcasting via Icecast-compatible streaming pipelines
- Analytics for playback, listeners, and AI decisions
- Modern dashboard UX for station operations and content management

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│ Frontend (Next.js 14 + React 18)                   │
│ - App Router                                        │
│ - Server + Client Components                        │
│ - Shadcn/UI + Tailwind CSS                          │
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
│ Backend Services                                     │
│ - Next.js API Routes                                │
│ - Supabase (PostgreSQL + Auth + Storage)            │
│ - OpenAI API (analysis/generation)                  │
│ - FFmpeg/FFprobe (audio processing)                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ Infrastructure                                      │
│ - Vercel (hosting)                                  │
│ - Supabase Cloud (database + storage)               │
│ - Icecast (stream server)                           │
└─────────────────────────────────────────────────────┘
```

## Documentation Files

1. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. [TECH_STACK.md](./TECH_STACK.md)
3. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
4. [PHASE_0_SETUP.md](./PHASE_0_SETUP.md)
5. [PHASE_1_DATABASE.md](./PHASE_1_DATABASE.md)
6. [PHASE_2_AUTH.md](./PHASE_2_AUTH.md)
7. [PHASE_3_AUDIO_ENGINE.md](./PHASE_3_AUDIO_ENGINE.md)
8. [PHASE_4_FILE_UPLOAD.md](./PHASE_4_FILE_UPLOAD.md)
9. [PHASE_5_AI_INTEGRATION.md](./PHASE_5_AI_INTEGRATION.md)
10. [API_ROUTES.md](./API_ROUTES.md)

## Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm
- Docker Desktop (for local Supabase)
- FFmpeg + FFprobe
- Supabase project and keys
- OpenAI API key

### Bootstrap

```bash
git clone <repository-url>
cd aetherradio
pnpm install
cp .env.example .env.local
pnpm supabase db push
pnpm dev
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

## Development Timeline

- Week 1–2: setup, database, authentication
- Week 3: audio engine implementation
- Week 4: upload/storage pipeline
- Week 5: AI integration and track intelligence
- Week 6–8: playlist automation, broadcasting, analytics
- Week 9–10: hardening, QA, launch prep

## Team Workflow

- Branches: `main`, `develop`, `feature/*`, `hotfix/*`
- Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- PRs require scoped changes, validation output, and peer review

## Version

- Last Updated: February 14, 2026
- Version: 1.0.0

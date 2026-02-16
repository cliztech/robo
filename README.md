# AetherRadio - AI-Powered Radio Automation Platform

**Complete Implementation Guide for Development Team**

## 🎯 Project Overview

AetherRadio is a next-generation AI-powered radio automation platform that enables users to run professional 24/7 internet radio stations with intelligent playlist generation, seamless crossfading, and real-time audio processing.

### Core Features

- **AI-Powered Automation**: Intelligent track selection and playlist generation
- **Professional Audio Engine**: Web Audio API with 5-band EQ, compression, and limiting
- **Seamless Crossfading**: Multiple crossfade algorithms with beat matching
- **Real-time Broadcasting**: Live streaming with Icecast integration
- **Smart Analytics**: Track performance, listener stats, and AI decision tracking
- **Modern UI**: Dark theme, drag-and-drop uploads, real-time visualizations

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────┐
│ Frontend (Next.js 14 + React 18)                   │
│ - App Router                                        │
│ - Server Components + Client Components             │
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
│ Backend Services                                    │
│ - Next.js API Routes                                │
│ - Supabase (PostgreSQL + Auth + Storage)           │
│ - OpenAI API (AI Analysis)                          │
│ - FFmpeg/FFprobe (Audio Processing)                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ Infrastructure                                      │
│ - Vercel (Hosting)                                  │
│ - Supabase Cloud (Database + Storage)               │
│ - Icecast (Streaming Server)                        │
└─────────────────────────────────────────────────────┘
```

## 📁 Documentation Files

1. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Complete folder structure
2. [TECH_STACK.md](TECH_STACK.md) - Technologies and dependencies
3. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete database schema
4. [PHASE_0_SETUP.md](PHASE_0_SETUP.md) - Environment setup (Day 1)
5. [PHASE_1_DATABASE.md](PHASE_1_DATABASE.md) - Database architecture (Day 2-3)
6. [PHASE_2_AUTH.md](PHASE_2_AUTH.md) - Authentication system (Day 4)
7. [PHASE_3_AUDIO_ENGINE.md](PHASE_3_AUDIO_ENGINE.md) - Audio engine (Day 5-7)
8. [PHASE_4_FILE_UPLOAD.md](PHASE_4_FILE_UPLOAD.md) - File upload system (Day 8-10)
9. [API_ROUTES.md](API_ROUTES.md) - API endpoints reference

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
cd aetherradio
pnpm install
cp .env.example .env.local
pnpm supabase db reset
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

```bash
pnpm build
pnpm start
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
Team: AetherRadio Development Team

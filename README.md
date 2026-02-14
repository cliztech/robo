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
│  Frontend (Next.js 14 + React 18)                  │
│  - App Router                                       │
│  - Server Components + Client Components            │
│  - Shadcn/UI + Tailwind CSS                         │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Audio Engine (Web Audio API)                       │
│  - AudioContext, Nodes, Analysers                   │
│  - Crossfade algorithms                              │
│  - EQ, Compression, Limiting                         │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Backend Services                                   │
│  - Next.js API Routes                               │
│  - Supabase (PostgreSQL + Auth + Storage)           │
│  - OpenAI API (AI Analysis)                         │
│  - FFmpeg/FFprobe (Audio Processing)                │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│  Infrastructure                                     │
│  - Vercel (Hosting)                                 │
│  - Supabase Cloud (Database + Storage)              │
│  - Icecast (Streaming Server)                       │
└─────────────────────────────────────────────────────┘
```

## 📁 Documentation Files

This implementation guide is split into multiple files:

1. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete folder structure
2. **[TECH_STACK.md](TECH_STACK.md)** - Technologies and dependencies
3. **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Complete database schema
4. **[PHASE_0_SETUP.md](PHASE_0_SETUP.md)** - Environment setup (Day 1)
5. **[PHASE_1_DATABASE.md](PHASE_1_DATABASE.md)** - Database architecture (Day 2-3)
6. **[PHASE_2_AUTH.md](PHASE_2_AUTH.md)** - Authentication system (Day 4)
7. **[PHASE_3_AUDIO_ENGINE.md](PHASE_3_AUDIO_ENGINE.md)** - Audio engine (Day 5-7)
8. **[PHASE_4_FILE_UPLOAD.md](PHASE_4_FILE_UPLOAD.md)** - File upload system (Day 8-10)
9. **[API_ROUTES.md](API_ROUTES.md)** - API endpoints reference

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x LTS
- pnpm (recommended) or npm
- Docker Desktop (for local Supabase)
- Supabase CLI (see [official docs](https://supabase.com/docs/guides/cli) for installation)
- FFmpeg with libopus, libmp3lame, libfdk-aac
- Supabase account
- OpenAI API key

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd aetherradio

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Initialize database
pnpm supabase db push

# 5. Run development server
pnpm dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📅 Development Timeline

### Week 1-2: Foundation (Phases 0-2)
- Day 1: Project setup and environment
- Day 2-3: Database architecture
- Day 4: Authentication system

### Week 3: Audio Core (Phase 3)
- Day 5-7: Audio engine implementation

### Week 4: Media Management (Phase 4)
- Day 8-10: File upload and storage

### Week 5-8: AI & Features
- AI track analysis
- Playlist generation
- Broadcasting system
- Dashboard UI

### Week 9-10: Polish & Launch
- Testing and bug fixes
- Performance optimization
- Beta launch

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📦 Deployment

```bash
# Build for production
pnpm build

# Preview production build
pnpm start

# Deploy to Vercel
vercel --prod
```

## 🤝 Team Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Commit Convention
- `feat: Add audio crossfade algorithm`
- `fix: Resolve upload progress calculation`
- `docs: Update API documentation`
- `refactor: Optimize database queries`
- `test: Add audio engine unit tests`

### Code Review Process
1. Create feature branch from `develop`
2. Implement feature following phase documentation
3. Write tests
4. Create pull request
5. Code review (2 approvals required)
6. Merge to `develop`
7. Deploy to staging
8. Merge to `main` for production

## 📚 Key Resources

- Next.js Documentation
- Supabase Docs
- Web Audio API
- OpenAI API
- Shadcn/UI

## 🐛 Common Issues

### Audio Context Suspended
**Problem:** AudioContext is suspended due to browser autoplay policy.

**Solution:** Resume context on user interaction (see `PHASE_3_AUDIO_ENGINE.md`).

### Upload Fails
**Problem:** File upload fails silently.

**Solution:** Check Supabase storage bucket policies (see `PHASE_4_FILE_UPLOAD.md`).

### CORS Errors
**Problem:** CORS errors when accessing Supabase.

**Solution:** Verify environment variables and Supabase project settings.

## 💬 Support

- **Technical Issues:** Create GitHub issue
- **Questions:** Team Slack `#aetherradio-dev`
- **Documentation:** Refer to phase-specific `.md` files

## 📄 License

Proprietary - All rights reserved

---

Last Updated: February 14, 2026  
Version: 1.0.0  
Team: AetherRadio Development Team

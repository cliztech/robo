# DGN-DJ by DGNradio - Technology Stack

## Core Runtime & Framework

- **Node.js 20.x** (canonical JS runtime)
- **Next.js 15.5.10** (root app; App Router + route handlers)
- **React 18** (hooks, suspense, context)
- **TypeScript 5** (strict mode)

## UI & Styling

- **Tailwind CSS 3**
- **Shadcn/UI**
- **Framer Motion 11.x**
- **Lucide React 0.378.x**

## Backend & Data

- **Python 3.10+** (backend services runtime)
- **FastAPI** (backend service APIs)
- **Supabase**
  - PostgreSQL
  - Auth
  - Storage
  - Realtime
- **PostgreSQL extensions**: `uuid-ossp`, `pg_cron`, `vector` (optional)

## Audio Stack

- **Web Audio API** (in-browser engine)
- **FFmpeg/FFprobe** (server-side analysis/transcoding)
- **Howler.js** (optional compatibility fallback)

## AI Stack

- **OpenAI API** (`gpt-4o`, `gpt-4o-mini`)
- **Vercel AI SDK (`ai` 3.x)** for typed AI integration

## Upload, Validation, State

- **React Dropzone** (file ingestion)
- **React Hook Form + Zod** (forms/validation)
- **Zustand** (global state)

## Payments & Streaming

- **Stripe** (checkout, subscriptions, webhooks)
- **Icecast 2.4+** (live stream distribution)

## Developer Tooling

- **ESLint + Prettier**
- **Vitest 4.x + React Testing Library**
- **Playwright**
- **Husky + lint-staged**

## Deployment

- **Vercel** (root Next.js app)
- **Docker Compose** (service stack runtime, including `radio-agentic`)
- **Windows launcher + packaged desktop flow**
- **Supabase Cloud** (database/storage/auth)
- **Cloudflare** (DNS/security optional)
- **DigitalOcean/AWS** (Icecast hosting options)

## System Requirements

### Development

- Node.js 20.x LTS
- 8 GB RAM minimum
- 20 GB free disk space
- Modern browser

### Production

- Vercel account
- Supabase account
- OpenAI API key
- Stripe account (if billing enabled)

Last Updated: February 28, 2026

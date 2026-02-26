# DGN-DJ Studio - Technology Stack

## Core Framework

- **Next.js 14** (App Router, API routes, middleware)
- **React 18** (hooks, suspense, context)
- **TypeScript 5** (strict mode)

## UI & Styling

- **Tailwind CSS 3**
- **Shadcn/UI**
- **Framer Motion**
- **Lucide React**

## Backend & Data

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
- **Vercel AI SDK** for typed AI integration

## Upload, Validation, State

- **React Dropzone** (file ingestion)
- **React Hook Form + Zod** (forms/validation)
- **Zustand** (global state)

## Payments & Streaming

- **Stripe** (checkout, subscriptions, webhooks)
- **Icecast 2.4+** (live stream distribution)

## Developer Tooling

- **ESLint + Prettier**
- **Vitest + React Testing Library**
- **Playwright**
- **Husky + lint-staged**

## Deployment

- **Vercel** (frontend/API)
- **Supabase Cloud** (database/storage)
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

Last Updated: February 14, 2026

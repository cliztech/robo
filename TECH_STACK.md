# AetherRadio — Technology Stack

## Frontend

- **Next.js 14** (App Router, middleware, API routes)
- **React 18** (hooks + concurrent rendering)
- **TypeScript 5** (strict mode)
- **Tailwind CSS + Shadcn/UI** for styling and component system

## Backend + Data

- **Supabase**
  - PostgreSQL (primary data store)
  - Auth (session + OAuth)
  - Storage (audio/artwork)
  - Realtime (dashboard updates)
- **Next.js Route Handlers** for backend APIs

## Audio + Media

- **Web Audio API** for real-time client playback and DSP
- **FFmpeg / FFprobe** for metadata extraction + transcoding
- **Icecast** for live stream distribution

## AI

- **OpenAI API** for tagging/classification and playlist generation
- **Vercel AI SDK** for typed model integration

## Quality + Tooling

- ESLint + Prettier
- Vitest + Testing Library + Playwright
- pnpm + Husky + lint-staged

_Last updated: 2026-02-14_

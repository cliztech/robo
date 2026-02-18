# AetherRadio — Technology Stack

## Core

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript 5** (strict mode)

## UI

- **Tailwind CSS 3**
- **Shadcn/UI** (+ Radix primitives)
- **Framer Motion**
- **Lucide React**

## Backend/Data

- **Supabase**: PostgreSQL, Auth, Storage, Realtime
- **Next.js API routes** for server logic
- **RLS** enforced on station-scoped tables

## Audio

- **Web Audio API**: AudioContext, BiquadFilterNode, DynamicsCompressorNode, AnalyserNode
- **FFmpeg/FFprobe**: metadata extraction, transcoding, waveform assets

## AI

- **OpenAI API** for classification and playlist generation
- **Vercel AI SDK** for typed integration and streaming responses

## Tooling

- **ESLint + Prettier**
- **Vitest + Testing Library**
- **Playwright** for E2E
- **pnpm** package manager

## Hosting

- **Vercel** for app/API
- **Supabase Cloud** for data/storage
- **Icecast** for outbound stream distribution

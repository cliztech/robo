# Phase 0 - Setup (Day 1)

## Goal

Provision a working local environment for all contributors with consistent tooling and validated environment variables.

## Deliverables

- Next.js app boots locally (`pnpm dev`)
- Supabase local stack starts
- `.env.local` configured and validated
- FFmpeg available in PATH
- Initial CI checks passing

## Step-by-Step

## 1) Create project and install deps

```bash
pnpm create next-app@latest aetherradio --ts --tailwind --eslint --app --src-dir --import-alias '@/*'
cd aetherradio
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs zod react-hook-form @hookform/resolvers
pnpm add framer-motion lucide-react zustand react-dropzone ai @ai-sdk/openai
pnpm add stripe @stripe/stripe-js date-fns clsx tailwind-merge class-variance-authority
pnpm add -D vitest @testing-library/react @testing-library/jest-dom playwright @types/node
```

## 2) Initialize Supabase

```bash
pnpm dlx supabase init
pnpm dlx supabase start
```

## 3) Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

OPENAI_API_KEY=sk-...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4) Add env validation helper

Create `src/lib/env.ts` using Zod with server/client split validation.

Validation rules:
- Fail fast on missing required variables.
- Never expose server secrets to client bundles.
- Keep optional integrations nullable.

## 5) Install FFmpeg

- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt-get install ffmpeg`
- Windows: use Scoop/Chocolatey or static binary and add to PATH.

Verify:

```bash
ffmpeg -version
ffprobe -version
```

## 6) Setup lint, type-check, and test scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## 7) Baseline verification

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm dev
```

## Exit Criteria

- All developers can run app locally in < 15 minutes setup time.
- No missing env vars at runtime.
- CI baseline pipeline green.

Last Updated: February 14, 2026

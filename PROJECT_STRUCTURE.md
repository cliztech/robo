# AetherRadio — Project Structure

## Top-Level Layout

```text
aetherradio/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── supabase/
│   ├── migrations/
│   └── functions/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── public/
└── package.json
```

## App Router Overview (`src/app`)

- `(auth)`: login, signup, forgot-password
- `(dashboard)`: stations, tracks, playlists, analytics, settings
- `api`: REST-like route handlers for auth, tracks, AI, stream, webhooks

## Component Organization (`src/components`)

- `audio/`: player, mixer, EQ, meters, visualizer
- `station/`: station cards, now-playing, queue, playlist views
- `upload/`: dropzone, progress, batch upload
- `ai/`: AI assistant and decision cards
- `ui/`: Shadcn base components

## Service Layer (`src/lib`)

- `audio/`: engine, analysis, crossfade
- `ai/`: track analysis and playlist generation
- `db/`: typed DB data access
- `supabase/`: client/server helpers
- `streaming/`: Icecast/encoder integration

## Naming Conventions

- Components: `PascalCase.tsx`
- Utilities/services: `kebab-case.ts` or `camelCase.ts`
- Hooks: `useX.ts`
- API route folders: lowercase paths

_Last updated: 2026-02-14_

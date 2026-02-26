# DGN-DJ Studio - Project Structure

## Complete Folder Organization

```text
aetherradio/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── config.toml
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Key Directories

### `/src/app`

Next.js App Router pages, route groups, and API routes.

### `/src/components`

Feature-oriented React components:

- `audio/`
- `station/`
- `upload/`
- `ai/`
- `ui/`

### `/src/lib`

Business logic and service integrations:

- `audio/`
- `ai/`
- `db/`
- `supabase/`
- `streaming/`

### `/tests`

- `unit/`
- `integration/`
- `e2e/`

## Naming Conventions

- **Components**: `PascalCase` (e.g., `AudioPlayer.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAudioEngine.ts`)
- **Utilities**: `kebab-case` or `camelCase` (e.g., `upload-service.ts`)
- **Constants**: `UPPER_SNAKE_CASE`
- **Routes**: lowercase path segments

## Import Aliases

```json
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/types/*": ["./src/types/*"]
}
```

Last Updated: February 14, 2026

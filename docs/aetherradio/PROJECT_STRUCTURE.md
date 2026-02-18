# AetherRadio — Project Structure

## Top-Level Layout

```text
aetherradio/
├── .github/workflows/
├── public/
├── src/
├── supabase/
├── tests/
├── docs/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## `src/` Organization

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── audio/
│   ├── station/
│   ├── upload/
│   ├── ai/
│   └── ui/
├── lib/
│   ├── audio/
│   ├── ai/
│   ├── db/
│   ├── streaming/
│   └── supabase/
├── hooks/
├── types/
└── middleware.ts
```

## Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities/services: `kebab-case.ts`
- API route files: `route.ts`
- Directory routes: lowercase slugs

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

## Feature Module Pattern

```text
feature/
├── index.ts
├── FeatureComponent.tsx
├── feature-service.ts
├── feature-types.ts
└── __tests__/feature.test.ts
```

# AetherRadio - Project Structure

## Complete Folder Organization

```text
aetherradio/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Continuous integration
│       └── deploy.yml                  # Deployment pipeline
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
│
├── src/
│   ├── app/                            # Next.js 14 App Router
│   │   ├── (auth)/                     # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                # Dashboard route group
│   │   │   ├── layout.tsx              # Dashboard layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Dashboard home
│   │   │   └── stations/
│   │   │       ├── page.tsx            # Station list
│   │   │       ├── new/
│   │   │       │   └── page.tsx        # Create station
│   │   │       └── [slug]/
│   │   │           ├── page.tsx        # Station dashboard
│   │   │           ├── tracks/
│   │   │           │   ├── page.tsx    # Track management
│   │   │           │   └── upload/
│   │   │           │       └── page.tsx
│   │   │           ├── playlist/
│   │   │           │   └── page.tsx
│   │   │           ├── live/
│   │   │           │   └── page.tsx    # Live broadcast
│   │   │           ├── analytics/
│   │   │           │   └── page.tsx
│   │   │           └── settings/
│   │   │               └── page.tsx
│   │   │
│   │   ├── api/                        # API Routes
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── tracks/
│   │   │   │   ├── analyze/
│   │   │   │   │   └── route.ts        # Metadata extraction
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts        # CRUD operations
│   │   │   │       └── waveform/
│   │   │   │           └── route.ts
│   │   │   ├── ai/
│   │   │   │   ├── analyze-track/
│   │   │   │   │   └── route.ts        # AI track analysis
│   │   │   │   └── generate-playlist/
│   │   │   │       └── route.ts
│   │   │   ├── stream/
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts        # Stream endpoint
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Global styles
│   │   └── not-found.tsx
│   │
│   ├── components/                     # React components
│   │   ├── audio/
│   │   │   ├── AudioPlayer.tsx         # Main audio player
│   │   │   ├── Mixer.tsx               # Audio mixer UI
│   │   │   ├── Equalizer.tsx           # EQ controls
│   │   │   ├── Meters.tsx              # Audio meters
│   │   │   ├── Waveform.tsx            # Waveform display
│   │   │   └── Visualizer.tsx          # Frequency visualizer
│   │   │
│   │   ├── station/
│   │   │   ├── NowPlaying.tsx          # Current track display
│   │   │   ├── UpNext.tsx              # Queue preview
│   │   │   ├── PlaylistView.tsx        # Playlist component
│   │   │   ├── TrackList.tsx           # Track listing
│   │   │   └── StationCard.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── FileUploader.tsx        # Drag & drop upload
│   │   │   ├── UploadProgress.tsx      # Progress bars
│   │   │   └── BatchUpload.tsx
│   │   │
│   │   ├── ai/
│   │   │   ├── AIAssistant.tsx         # AI decision feed
│   │   │   ├── AIDecisionCard.tsx
│   │   │   └── ConfidenceScore.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ListenerChart.tsx
│   │   │   └── TrackPerformance.tsx
│   │   │
│   │   └── ui/                         # Shadcn/UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── slider.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── progress.tsx
│   │       ├── alert.tsx
│   │       ├── tabs.tsx
│   │       └── ... (other Shadcn components)
│   │
│   ├── lib/                            # Utility libraries
│   │   ├── audio/
│   │   │   ├── engine.ts               # AudioEngine class
│   │   │   ├── analyzer.ts             # Audio analysis
│   │   │   ├── crossfade.ts            # Crossfade algorithms
│   │   │   └── metadata-extractor.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── analyze-track.ts        # AI track analysis
│   │   │   ├── generate-playlist.ts    # Playlist generation
│   │   │   └── suggest-next.ts
│   │   │
│   │   ├── upload/
│   │   │   └── upload-service.ts       # Upload service
│   │   │
│   │   ├── streaming/
│   │   │   ├── icecast.ts              # Icecast integration
│   │   │   └── encoder.ts
│   │   │
│   │   ├── db/
│   │   │   ├── tracks.ts               # Track queries
│   │   │   ├── stations.ts             # Station queries
│   │   │   ├── playlists.ts
│   │   │   └── analytics.ts
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts               # Client-side Supabase
│   │   │   ├── server.ts               # Server-side Supabase
│   │   │   ├── queries.ts
│   │   │   └── storage.ts
│   │   │
│   │   ├── stripe.ts                   # Payment integration
│   │   └── utils.ts                    # Utility functions
│   │
│   ├── hooks/                          # React hooks
│   │   ├── useAudioEngine.ts           # Audio engine hook
│   │   ├── useUpload.ts                # Upload hook
│   │   ├── useStation.ts               # Station data hook
│   │   ├── useRealtime.ts              # Supabase Realtime
│   │   ├── usePlaylist.ts
│   │   └── useAnalytics.ts
│   │
│   ├── types/                          # TypeScript types
│   │   ├── database.ts                 # Generated from Supabase
│   │   ├── audio.ts                    # Audio engine types
│   │   ├── api.ts                      # API response types
│   │   └── index.ts
│   │
│   └── middleware.ts                   # Next.js middleware
│
├── supabase/                           # Supabase configuration
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # Database schema
│   ├── functions/                      # Edge functions
│   └── config.toml
│
├── tests/                              # Test files
│   ├── unit/
│   │   ├── audio-engine.test.ts
│   │   ├── crossfade.test.ts
│   │   └── upload-service.test.ts
│   ├── integration/
│   │   ├── api-routes.test.ts
│   │   └── database.test.ts
│   └── e2e/
│       ├── auth.spec.ts
│       ├── upload.spec.ts
│       └── playback.spec.ts
│
├── docs/                               # Documentation
│   ├── api/
│   ├── architecture/
│   └── guides/
│
├── .env.example                        # Environment template
├── .env.local                          # Local environment (gitignored)
├── .eslintrc.json                      # ESLint config
├── .prettierrc                         # Prettier config
├── .gitignore
├── next.config.js                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind CSS config
├── tsconfig.json                       # TypeScript config
├── package.json                        # Dependencies
├── pnpm-lock.yaml                      # Lock file
└── README.md                           # Main documentation
```

## Key Directories Explained

### `/src/app`
Next.js 14 App Router structure. Uses route groups for organization:
- `(auth)` - Authentication pages (no dashboard layout)
- `(dashboard)` - Main application (includes dashboard layout)
- `api` - API routes (serverless functions)

### `/src/components`
Reusable React components organized by feature:
- `audio/` - Audio playback and visualization
- `station/` - Station-specific components
- `upload/` - File upload components
- `ai/` - AI-related UI
- `ui/` - Base UI components (Shadcn)

### `/src/lib`
Business logic and utilities:
- `audio/` - Audio processing logic
- `ai/` - AI integration
- `db/` - Database queries
- `supabase/` - Supabase helpers

### `/src/hooks`
Custom React hooks for stateful logic.

### `/supabase`
Supabase-specific files:
- `migrations/` - Database migrations (SQL)
- `functions/` - Edge functions (if needed)

## File Naming Conventions

- **Components**: PascalCase (e.g., `AudioPlayer.tsx`)
- **Utilities**: camelCase (e.g., `upload-service.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAudioEngine.ts`)
- **Types**: PascalCase (e.g., `AudioMetrics`)
- **Constants**: UPPER_SNAKE_CASE
- **Routes**: lowercase (e.g., `/api/tracks/analyze`)

## Import Aliases

```typescript
// tsconfig.json paths
{
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  "@/lib/*": ["./src/lib/*"],
  "@/hooks/*": ["./src/hooks/*"],
  "@/types/*": ["./src/types/*"]
}
```

## Module Organization

Each feature follows this structure:

```text
feature/
├── index.ts              # Public exports
├── FeatureComponent.tsx  # Main component
├── feature-service.ts    # Business logic
├── feature-types.ts      # TypeScript types
└── __tests__/            # Tests
    └── feature.test.ts
```

Last Updated: February 14, 2026

# Phase 0: Project Initialization & Environment Setup

**Timeline**: Day 1  
**Goal**: Complete development environment setup and project scaffolding

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 20.x LTS installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Git installed and configured
- [ ] VS Code (or preferred IDE)
- [ ] Docker Desktop (optional, for local Supabase)
- [ ] FFmpeg installed with required codecs
- [ ] Supabase account created
- [ ] OpenAI API key obtained
- [ ] Stripe account (for payments)

## Step 1: Verify Node.js Installation

```bash
# Check Node.js version (should be 20.x)
node --version

# Check pnpm version
pnpm --version

# If pnpm not installed:
npm install -g pnpm
```

## Step 2: Install FFmpeg

### macOS

```bash
brew install ffmpeg
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install ffmpeg libopus-dev libmp3lame-dev libfdk-aac-dev
```

### Windows

Download from: https://ffmpeg.org/download.html

Verify installation:

```bash
ffmpeg -version
ffprobe -version
```

## Step 3: Create Next.js Project

```bash
# Create project
pnpm create next-app@latest aetherradio

# Configuration options:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? Yes
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? Yes
# ✔ What import alias would you like configured? @/*

cd aetherradio
```

## Step 4: Install Core Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs ai @ai-sdk/openai zod @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-tabs @radix-ui/react-tooltip framer-motion lucide-react react-hook-form @hookform/resolvers zustand react-dropzone date-fns nanoid class-variance-authority clsx tailwind-merge stripe @stripe/stripe-js @vercel/analytics @vercel/speed-insights
```

## Step 5: Setup shadcn/ui

```bash
# Initialize shadcn/ui
pnpm dlx shadcn-ui@latest init

# Configuration:
# ✔ Which style would you like to use? Default
# ✔ Which color would you like to use as base color? Slate
# ✔ Would you like to use CSS variables for colors? Yes

# Install commonly used components
pnpm dlx shadcn-ui@latest add button input slider dialog dropdown-menu select card badge progress alert tabs label separator skeleton
```

## Step 6: Configure Tailwind CSS

Edit `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

## Step 7: Setup Environment Variables

Create `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Create `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

## Step 8: Configure TypeScript

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Step 9: Configure ESLint

Edit `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error"
  }
}
```

## Step 10: Setup Prettier

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```gitignore
node_modules
.next
dist
build
coverage
*.log
.env*
```

## Step 11: Setup Git

Create `.gitignore`:

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/
dist
build

# Environment
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
.DS_Store
*.pem

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/*
!.vscode/extensions.json
.idea
```

Initialize Git:

```bash
git init
git add .
git commit -m "feat: initial project setup"
```

## Step 12: Create Project Structure

```bash
# Create directories
mkdir -p src/components/{audio,station,upload,ai,analytics,ui}
mkdir -p src/lib/{audio,ai,db,supabase,upload,streaming}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p supabase/migrations
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs/{api,architecture,guides}

# Create placeholder files
touch src/lib/utils.ts
touch src/types/index.ts
touch src/middleware.ts
```

## Step 13: Setup Supabase CLI (Optional - for local development)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase

# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull
```

## Step 14: Configure Next.js

Edit `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Webpack config for audio file handling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
```

## Step 15: Create Utility Functions

Create `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
```

## Step 16: Setup `package.json` Scripts

Edit `package.json` to add useful scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "supabase:gen-types": "supabase gen types typescript --project-id your-project-id > src/types/database.ts",
    "prepare": "husky install"
  }
}
```

## Step 17: Create VS Code Settings (Optional)

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.next": true,
    "**/node_modules": true
  }
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "supabase.supabase-vscode"
  ]
}
```

## Step 18: Verify Installation

```bash
# Run development server
pnpm dev

# In another terminal, run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

Visit http://localhost:3000 to verify the app is running.

## Step 19: Create Initial Commit

```bash
git add .
git commit -m "chore: complete project setup and configuration"
```

## Step 20: Create GitHub Repository (Optional)

```bash
# Create repository on GitHub, then:
git remote add origin https://github.com/your-username/aetherradio.git
git branch -M main
git push -u origin main
```

## Troubleshooting

### Issue: `pnpm` not found

**Solution**: Install `pnpm` globally

```bash
npm install -g pnpm
```

### Issue: FFmpeg not in PATH

**Solution**: Add FFmpeg to system PATH or use full path

```bash
# macOS/Linux
export PATH="/usr/local/bin:$PATH"

# Windows: Add FFmpeg bin folder to System Environment Variables
```

### Issue: Port 3000 already in use

**Solution**: Use a different port

```bash
pnpm dev -p 3001
```

### Issue: TypeScript errors

**Solution**: Restart TypeScript server in VS Code  
Cmd/Ctrl + Shift + P → TypeScript: Restart TS Server

## Verification Checklist

Before moving to Phase 1, verify:

- [ ] `pnpm dev` runs without errors
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatting works (`pnpm format`)
- [ ] All environment variables are set
- [ ] Git repository is initialized
- [ ] FFmpeg is accessible from command line
- [ ] Supabase project is created
- [ ] OpenAI API key is valid
- [ ] Directory structure is complete

## Next Steps

Proceed to `PHASE_1_DATABASE.md` to setup the database schema and Supabase configuration.

**Estimated Time**: 2-3 hours  
**Last Updated**: February 14, 2026

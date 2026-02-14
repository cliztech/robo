# AetherRadio - Technology Stack

## Core Framework

### Next.js 14
- **Version**: 14.x (App Router)
- **Why**: React framework with server components, API routes, and excellent performance
- **Features Used**:
  - App Router for file-based routing
  - Server Components for better performance
  - API Routes for backend logic
  - Middleware for authentication
  - Image optimization
  - Font optimization

### React 18
- **Version**: 18.x
- **Why**: Industry-standard UI library with hooks and concurrent features
- **Features Used**:
  - Hooks (useState, useEffect, useCallback, etc.)
  - Context API for global state
  - Suspense for loading states

### TypeScript
- **Version**: 5.x
- **Why**: Type safety, better developer experience, catches bugs early
- **Configuration**: Strict mode enabled

## UI & Styling

### Tailwind CSS
- **Version**: 3.x
- **Why**: Utility-first CSS framework, rapid development
- **Plugins**:
  - @tailwindcss/forms
  - @tailwindcss/typography
  - tailwindcss-animate

### Shadcn/UI
- **Version**: Latest
- **Why**: High-quality, accessible, customizable components
- **Components Used**:
  - Button, Input, Slider
  - Dialog, Dropdown Menu
  - Card, Badge, Progress
  - Alert, Tabs, Select

### Framer Motion
- **Version**: 11.x
- **Why**: Smooth animations and transitions
- **Use Cases**:
  - Page transitions
  - Component animations
  - Micro-interactions

### Lucide React
- **Version**: Latest
- **Why**: Beautiful, consistent icon set
- **Usage**: UI icons throughout the app

## Backend & Database

### Supabase
- **Services Used**:
  - **PostgreSQL**: Primary database
  - **Auth**: User authentication and authorization
  - **Storage**: File storage for audio tracks and artwork
  - **Realtime**: Live updates and presence

- **Why Supabase**:
  - Managed PostgreSQL with real-time capabilities
  - Built-in authentication
  - Row Level Security (RLS)
  - Auto-generated APIs
  - Generous free tier

### Database Extensions
- `uuid-ossp`: UUID generation
- `pg_cron`: Scheduled tasks
- `vector`: AI embeddings (future use)

## Audio Processing

### Web Audio API
- **Native Browser API**
- **Why**: Powerful, low-latency audio processing in browser
- **Features Used**:
  - AudioContext
  - AudioBufferSourceNode
  - GainNode (volume control)
  - BiquadFilterNode (EQ)
  - DynamicsCompressorNode (compression/limiting)
  - AnalyserNode (visualization)

### FFmpeg / FFprobe
- **Server-side audio processing**
- **Use Cases**:
  - Metadata extraction
  - Waveform generation
  - Album art extraction
  - Audio format conversion
  - Quality analysis

### Howler.js (Optional fallback)
- **Version**: 2.x
- **Why**: Fallback for older browsers, simpler API
- **Use Case**: Basic playback if Web Audio API unavailable

## AI & Machine Learning

### OpenAI API
- **Models Used**:
  - **GPT-4o**: Complex analysis, reasoning
  - **GPT-4o-mini**: Quick analysis, cost-effective

- **Use Cases**:
  - Track genre/mood classification
  - BPM detection
  - Energy level assessment
  - Playlist generation
  - Smart track ordering

### Vercel AI SDK
- **Version**: 3.x
- **Why**: Streamlined AI integration, type-safe
- **Features**:
  - `generateText()` for text generation
  - `generateObject()` for structured data
  - Streaming support
  - Edge function compatibility

## File Upload & Storage

### React Dropzone
- **Version**: 14.x
- **Why**: Drag-and-drop file upload with validation
- **Features**:
  - File type validation
  - Size limits
  - Multiple file upload
  - Progress tracking

### Supabase Storage
- **Features**:
  - Large file support (up to 50GB)
  - Resumable uploads
  - Signed URLs for private files
  - CDN integration
  - Row Level Security

## State Management

### Zustand
- **Version**: 4.x
- **Why**: Lightweight, simple API, no boilerplate
- **Use Cases**:
  - Global app state
  - User preferences
  - UI state (modals, sidebars)

### Jotai (Alternative)
- **Version**: 2.x
- **Why**: Atomic state management, great for complex state
- **Use Cases**:
  - Component-level state
  - Derived state

## Forms & Validation

### React Hook Form
- **Version**: 7.x
- **Why**: Performant, easy validation, great DX
- **Features**:
  - Minimal re-renders
  - Built-in validation
  - Easy integration with Zod

### Zod
- **Version**: 3.x
- **Why**: TypeScript-first schema validation
- **Use Cases**:
  - Form validation
  - API response validation
  - Environment variable validation

## Payments

### Stripe
- **Version**: Latest
- **Products**:
  - Stripe Checkout
  - Customer Portal
  - Webhooks

- **Integration**:
  - @stripe/stripe-js (client)
  - stripe (server)

## Streaming

### Icecast
- **Version**: 2.4+
- **Why**: Industry-standard streaming server
- **Features**:
  - MP3/OGG streaming
  - Multiple mount points
  - Listener statistics
  - Metadata updates

### MediaSource Extensions (MSE)
- **Native Browser API**
- **Why**: Low-latency streaming in browser
- **Use Case**: Real-time audio streaming

## Development Tools

### ESLint
- **Version**: 8.x
- **Config**: Next.js recommended + custom rules
- **Plugins**:
  - eslint-plugin-react
  - eslint-plugin-react-hooks
  - @typescript-eslint

### Prettier
- **Version**: 3.x
- **Why**: Consistent code formatting
- **Config**: Default with some customizations

### Husky
- **Version**: 9.x
- **Why**: Git hooks for quality checks
- **Hooks**:
  - pre-commit: Run linter and type check
  - pre-push: Run tests

### TypeScript
- **Strict mode enabled**
- **Path aliases** for imports
- **Generated types** from Supabase

## Testing

### Vitest
- **Version**: 1.x
- **Why**: Fast, Vite-powered testing
- **Use Cases**:
  - Unit tests
  - Integration tests

### React Testing Library
- **Version**: 14.x
- **Why**: User-centric testing approach
- **Use Cases**:
  - Component tests
  - Integration tests

### Playwright
- **Version**: 1.x
- **Why**: Reliable E2E testing
- **Use Cases**:
  - End-to-end tests
  - Browser automation

## Monitoring & Analytics

### Vercel Analytics
- **Built-in with Vercel deployment**
- **Features**:
  - Web Vitals
  - Page views
  - Custom events

### Sentry (Optional)
- **Error tracking and monitoring**
- **Features**:
  - Error reporting
  - Performance monitoring
  - Release tracking

### PostHog (Optional)
- **Product analytics**
- **Features**:
  - Event tracking
  - User analytics
  - Feature flags

## Deployment & Hosting

### Vercel
- **Why**: Optimal for Next.js, zero-config deployment
- **Features**:
  - Edge Functions
  - Serverless Functions
  - CDN
  - Automatic HTTPS
  - Preview deployments

### Infrastructure
- **Supabase Cloud**: Database and storage
- **Vercel**: Frontend and API hosting
- **DigitalOcean/AWS**: Icecast streaming servers
- **Cloudflare**: DNS and DDoS protection

## Package Manager

### pnpm
- **Version**: 8.x
- **Why**: Fast, efficient, saves disk space
- **Alternative**: npm or yarn also work

## Complete Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",

    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",

    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.20",
    "@ai-sdk/anthropic": "^0.0.15",

    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",

    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",

    "zustand": "^4.4.7",
    "jotai": "^2.6.0",

    "react-dropzone": "^14.2.3",
    "nanoid": "^5.0.4",
    "date-fns": "^3.0.0",

    "stripe": "^14.7.0",
    "@stripe/stripe-js": "^2.2.0",

    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",

    "@vercel/analytics": "^1.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",

    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",

    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",

    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "playwright": "^1.40.0",

    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  }
}
```

## System Requirements

### Development
- Node.js 20.x LTS
- 8GB RAM minimum
- 20GB free disk space
- Modern browser (Chrome, Firefox, Safari)

### Production
- Vercel account (free tier works)
- Supabase account (free tier works)
- OpenAI API key ($5 minimum credit)
- Stripe account (for payments)

Last Updated: February 14, 2026

<<<<<<< HEAD
# Technology Stack: AetherRadio

## 1. Application Architecture
*   **Form Factor:** Desktop Application (Windows, macOS, Linux).
*   **Framework:** Electron.
*   **Frontend:** Next.js (v15) with React (v18).
*   **Language:** TypeScript.

## 2. Frontend & UI
*   **Styling:** Tailwind CSS (Utility-first CSS).
*   **Components:** Shadcn/UI (Radix UI based primitives).
*   **Icons:** Lucide-react.
*   **Animation:** Framer-motion.
*   **State Management:** Zustand (Low-latency, minimal boilerplate).
*   **Form Handling:** React Hook Form with Zod validation.

## 3. Audio & Streaming
*   **Audio Engine (Phase 1):** Web Audio API (Integrated within Electron/Chromium).
*   **Audio Engine (Phase 2):** WASM-based DSP for deterministic low-latency processing.
*   **Processing:** FFmpeg & FFprobe (Metadata extraction, transcoding).
*   **Streaming Protocol:** Icecast (Broadcasting to remote servers).
*   **Encoders:** libmp3lame, libopus, with a roadmap for AAC/AAC+.

## 4. Backend & Infrastructure
*   **Platform:** Supabase.
    *   **Database:** PostgreSQL.
    *   **Authentication:** Supabase Auth (OAuth & Email/Pass).
    *   **Storage:** Supabase Storage (Audio file hosting).
*   **AI Intelligence:** OpenAI API (GPT-4/o for show logic, Embeddings for similarity).
*   **Hosting (Web Components):** Vercel.

## 5. Development & Tooling
*   **Package Manager:** pnpm.
*   **Testing:** 
    *   **Unit/Component:** Vitest.
    *   **DOM Testing:** React Testing Library.
*   **Linting:** ESLint & Prettier.
*   **Database Tooling:** Supabase CLI for migrations and type generation.
*   **Agentic Framework:** BMAD (Base Model Agentic Development) for autonomous operation.
=======
# Tech Stack

- **Primary Executable**: RoboDJ Automation.exe
- **Backend**: Python (backend/)
- **Frontend/Console**: Next.js / Tailwind (apps/dj-console/)
- **Configuration**: JSON / SQLite (config/)

Refer to [TECH_STACK.md](../TECH_STACK.md) for full details.
>>>>>>> c287a1eb05d08b6cbcc6791eaa232a28b977e8b5

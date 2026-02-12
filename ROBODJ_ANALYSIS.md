# RoboDJ Application Analysis

## 1. System Overview
RoboDJ is a Windows desktop automation tool designed to generate AI-hosted voice tracks for radio playout systems (specifically "RadioDJ"). It acts as a middleware between the playout system and AI services.

## 2. Core Components

### A. Data Persistence (SQLite)
- **settings.db**: Stores application-wide configuration.
- **user_content.db**: Stores creative content (prompts, topics, music beds).

### B. Integration Points
1.  **Playout System ("RadioDJ")**:
    -   Connects via HTTP (default port 9300) and MySQL (default port 3306).
    -   Uses "VT Markers" (Voice Track markers) to trigger events.
    -   Reads/Writes metadata to the playout database.
2.  **AI Services**:
    -   **LLM**: OpenAI (GPT-4o), OpenRouter, Perplexity (for research). Used for script generation.
    -   **TTS**: ElevenLabs, Gemini. Used for voice synthesis.
3.  **External Data**:
    -   **Weather**: WeatherAPI integration.

### C. Content Model
-   **Prompts**: Templates for what the DJ should talk about.
    -   Support for "Research" (browsing the web for info).
    -   Categorized (e.g., Intro, Outro, Weather, News).
-   **Prompt Variables**: Dynamic injection of data (Artist, Title, Time, Weather) into prompts.
-   **Promo Topics**: Rotational content (ads, station identifiers, specific talking points).

### D. Audio Engine
-   **Music Beds**: Background music tracks with "ducking" settings (volume reduction when voice speaks).
-   **Processing**: Uses `ffmpeg` for audio mixing, format conversion (MP3), and silence removal.
-   **Multi-Voice**: Supports conversations between two AI voices (Speaker 1, Speaker 2).

## 3. Workflow (Inferred)
1.  **Trigger**: Application detects a need for a voice track (likely via Schedule or Playout System trigger).
2.  **Context Gathering**: Fetches current song, next song, weather, and active "Promo Topics".
3.  **Script Generation**: Sends prompt + context to LLM to generate natural speech text.
4.  **Audio Synthesis**: Sends text to TTS provider to generate raw vocal audio.
5.  **Post-Production**:
    -   Selects a music bed.
    -   Mixes vocal + music bed (with ducking).
    -   Exports file to a shared folder.
6.  **Handoff**: Updates Playout System database to point to the new audio file.

## 4. Key Configurations
-   **Freshness**: "Script Freshness" settings to prevent repetitive content.
-   **Banned Words**: Filter to ensure FCC compliance or brand safety.
-   **Scheduling**: Time-based logic for different prompts (Morning Show vs. Late Night).

## 5. Configuration Trust Boundaries

RoboDJ has a strict trust boundary between desktop/runtime configuration and web frontend payloads.

- **Desktop/runtime zone (trusted, private):** SQLite files, local key files (`config/secret.key`, `config/secret_v2.key`), provider API keys, and absolute/host-local file paths.
- **Frontend zone (untrusted/public):** Browser-delivered config and status payloads that may be inspected by end users.

### Boundary Rules
1. Runtime config is treated as private by default.
2. Only fields explicitly modeled in `contracts/public_frontend_config.schema.json` may be serialized for frontend responses.
3. Internal key paths and secret-bearing values must remain in `contracts/internal_config.schema.json` only.
4. Frontend response schemas in `contracts/frontend_responses/` are checked against denylisted key/path patterns before release.


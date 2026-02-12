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

## 5. Dedicated Time Model

To prevent inconsistencies between backend scheduling and frontend views, all queue/schedule records should follow a single time model.

### A. Canonical Storage Format
-   All persisted timestamps must be stored as **UTC ISO-8601** strings.
-   Format requirement: `YYYY-MM-DDTHH:mm:ssZ` (or with millisecond precision if needed, e.g. `YYYY-MM-DDTHH:mm:ss.SSSZ`).
-   Never store local wall-clock timestamps without timezone context.

### B. Station/Local Display Timezone Behavior
-   `station_timezone` stores an IANA timezone ID (example: `America/New_York`).
-   UI displays should default to `station_timezone` for operational screens (timeline, calendar, schedule editor).
-   User-local timezone display can be offered as a toggle, but UTC storage remains unchanged.
-   API responses should return UTC timestamps plus timezone metadata so clients can render consistently.

### C. DST Handling Rules
-   Recurring events are interpreted in `station_timezone` local time, then resolved to UTC for execution.
-   During DST spring-forward gaps (invalid local times), shift to the next valid local minute.
-   During DST fall-back overlaps (ambiguous local times), use the first occurrence unless explicitly overridden.
-   Never "freeze" recurrence execution to fixed UTC offsets when local station-time behavior is intended.

### D. Recurrence Format
-   Use an RFC 5545-style `recurrence_rule` string (`RRULE`) for recurring schedules.
-   Recommended minimum fields: `FREQ`, with optional `BYDAY`, `BYHOUR`, `BYMINUTE`, `INTERVAL`, `UNTIL`, `COUNT`.
-   Pair `recurrence_rule` with timezone context (`station_timezone`) to avoid DST drift.

### E. Window Constraints
-   Use explicit schedule windows to constrain when an item can execute:
    -   `effective_from` (UTC): first eligible instant.
    -   `starts_at_utc` (UTC): planned start instant for one-shot items or first generated occurrence.
    -   `ends_at_utc` (UTC): hard stop; no execution after this timestamp.
    -   `blackout_windows` (array): UTC intervals where execution is blocked.
-   If both recurrence and windows are defined, execution must satisfy both rule expansion and window eligibility.

### F. Queue/Schedule Object Extensions

```json
{
  "id": "sched_123",
  "station_timezone": "America/New_York",
  "starts_at_utc": "2026-03-10T13:00:00Z",
  "ends_at_utc": "2026-03-10T17:00:00Z",
  "effective_from": "2026-03-01T00:00:00Z",
  "recurrence_rule": "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0",
  "blackout_windows": [
    {
      "starts_at_utc": "2026-03-15T00:00:00Z",
      "ends_at_utc": "2026-03-16T00:00:00Z",
      "reason": "maintenance"
    }
  ]
}
```

### G. Frontend Display Rules (Timeline + Calendar)
-   Always parse backend timestamps as UTC first, then convert to display timezone.
-   Use the same timezone resolver for timeline and calendar components to prevent cross-view drift.
-   When users create/edit in station-local time, convert to UTC immediately before persistence.
-   Label displayed timezone clearly (`ET`, `PT`, etc. plus IANA zone in details panel).
-   For DST transition days, surface a UI hint for shifted/skipped times and render occurrences exactly as backend expansion defines.

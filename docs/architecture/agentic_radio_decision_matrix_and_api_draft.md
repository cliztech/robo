# Agentic Radio Platform: Build-vs-Buy Matrix, API/Webhook Draft, and Studio UX Mapping

This document adapts the autonomous radio architecture into implementation-ready decisions for:

1. Build-vs-buy selections by subsystem.
2. Concrete OpenAPI + webhook schemas for control plane and show-runner tools.
3. Detailed Studio app UX mapped to backend events/APIs.

---

## 1) Build vs Buy Decision Matrix (by subsystem)

### Decision scoring model

- **Weights**: Time-to-market (30%), Operational complexity (20%), Feature fit (20%), Cost predictability (15%), Vendor lock-in risk (15%).
- Scores are **1–5** (higher is better). Weighted score shown out of 5.
- Recommendation includes **default choice** and **fallback option**.

### 1.1 Ingest (RTMP, WHIP/WebRTC, source clients)

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Self-host gateway stack (SRS/mediasoup + custom auth/routing) | Build-heavy | 2 | 2 | 5 | 4 | 5 | **3.35** | Maximum control, strongest fit for hybrid ingest profiles. |
| Wowza Streaming Engine | Buy | 4 | 3 | 4 | 2 | 2 | **3.20** | Broad protocol support, faster launch, licensing overhead. |
| Cloudflare Stream Live ingest | Buy | 5 | 4 | 3 | 3 | 2 | **3.75** | Fast delivery, less flexible for radio-native control. |
| Dolby/Millicast WHIP/WebRTC ingest | Buy | 4 | 4 | 4 | 2 | 2 | **3.45** | Strong for ultra-low-latency ingest paths. |

**Default**: **Hybrid** — self-host RTMP + WHIP control edge for station auth/stream keys, with managed acceleration only where needed.

**Fallback**: If team capacity is constrained, use **Wowza** as bridge while preserving internal ingest auth abstraction so migration remains possible.

### 1.2 Mixer / DSP / Automation graph

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Liquidsoap-centric media graph + adapters | Buy/open-source | 4 | 3 | 5 | 5 | 5 | **4.30** | Mature radio automation and composable graphs. |
| Fully custom mixer engine (Rust/C++/Python DSP pipeline) | Build | 1 | 2 | 5 | 4 | 5 | **3.00** | Best long-term differentiation, highest complexity/risk. |
| Cloud media processing services | Buy | 4 | 4 | 2 | 2 | 1 | **2.95** | Easier ops, weak fit for cue/mix-minus radio workflows. |

**Default**: **Liquidsoap-first** server mixer/DSP pipeline + custom control API.

**Fallback**: Implement minimal custom mixer only for capabilities Liquidsoap cannot provide (e.g., deep studio-control hooks), keeping Liquidsoap for playout failover.

### 1.3 Streaming origin (HLS/LL-HLS/DASH + CDN)

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Self-host packager/origin (nginx + ffmpeg/cmaf packager) | Build | 2 | 2 | 5 | 4 | 5 | **3.35** | Control and cost efficiency at scale, more SRE burden. |
| AWS MediaPackage + CloudFront | Buy | 4 | 4 | 5 | 3 | 2 | **3.95** | Strong LL-HLS + live-to-VOD support. |
| Mux | Buy | 5 | 4 | 3 | 3 | 2 | **3.75** | Excellent developer speed, less radio-specific metadata flexibility. |
| Cloudflare Stream | Buy | 5 | 4 | 3 | 3 | 2 | **3.75** | Fast launch, may need custom metadata side-channels. |

**Default**: **AWS MediaPackage + CDN** for P0/P1 to de-risk launch and latency tuning.

**Fallback**: For cost optimization at scale, progressively migrate to self-host packaging while keeping player and metadata contracts stable.

### 1.4 AI Host (LLM orchestration + TTS)

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Managed LLM + managed TTS (OpenAI/Anthropic/Gemini + Polly/Azure/Google) | Buy | 5 | 4 | 4 | 3 | 2 | **3.95** | Fastest path, robust quality, vendor dependence. |
| OSS LLM + OSS TTS (self-host) | Build | 2 | 2 | 4 | 4 | 5 | **3.15** | Better control/privacy, high infra tuning overhead. |
| Hybrid (managed LLM + optional local fallback TTS/ASR) | Hybrid | 4 | 3 | 5 | 4 | 4 | **4.05** | Good resilience/cost/flexibility trade-off. |

**Default**: **Hybrid** — managed LLM tools + managed TTS for primary path, optional local fallback for continuity.

**Fallback**: In strict data-locality scenarios, switch to self-hosted models for selected stations while preserving the same tool schema.

### 1.5 Telephony / Callers / IVR

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Twilio Programmable Voice | Buy | 5 | 5 | 4 | 3 | 2 | **4.10** | Fastest inbound/outbound, proven IVR and webhooks. |
| Self-host Asterisk/FreeSWITCH SIP | Build | 2 | 2 | 5 | 5 | 5 | **3.50** | Deep control and lower marginal cost; requires telecom expertise. |
| Carrier-managed contact center stack | Buy | 4 | 4 | 3 | 2 | 1 | **2.95** | Enterprise support, weaker product flexibility. |

**Default**: **Twilio** for P1 launch.

**Fallback**: Add **Asterisk SIP edge** for high-volume stations or jurisdictional requirements; keep provider abstraction in `calls` service.

### 1.6 Moderation (ASR + policy + intervention)

| Option | Build vs Buy | Time | Ops | Fit | Cost | Lock-in | Weighted | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Managed ASR + managed toxicity APIs + in-house policy engine | Hybrid | 4 | 4 | 5 | 3 | 3 | **3.95** | Best implementation speed with domain policy ownership. |
| Fully managed moderation suite | Buy | 5 | 5 | 2 | 2 | 1 | **3.20** | Quick setup but weaker editorial control and explainability. |
| Fully self-host moderation (ASR + classifiers) | Build | 2 | 2 | 5 | 4 | 5 | **3.25** | Maximum control, slower to robust quality. |

**Default**: **Hybrid moderation** — managed real-time ASR + configurable in-house policy/risk engine + human override.

**Fallback**: For privacy-constrained environments, run on-prem ASR/classifiers for designated stations while keeping the same event schema.

---

## 2) OpenAPI + Webhook Schema Draft

## 2.1 API design conventions

- **Base URL**: `/api/v1`
- **Auth**: OAuth2 access token (`Bearer`) + per-station scope.
- **Idempotency**: `Idempotency-Key` required on write endpoints that trigger media/control actions.
- **Traceability**: `X-Request-Id` supported on all endpoints.
- **Time format**: RFC3339 UTC timestamps.

## 2.2 OpenAPI draft (abridged YAML)

```yaml
openapi: 3.1.0
info:
  title: Agentic Radio Control Plane API
  version: 0.1.0
servers:
  - url: https://api.example.com/api/v1
security:
  - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Error:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
        request_id: { type: string }
    Station:
      type: object
      required: [id, name, timezone]
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        timezone: { type: string, example: Australia/Sydney }
        locale: { type: string, example: en-AU }
    Show:
      type: object
      required: [id, station_id, title, format]
      properties:
        id: { type: string, format: uuid }
        station_id: { type: string, format: uuid }
        title: { type: string }
        format: { type: string, enum: [music, talk, mixed] }
    Episode:
      type: object
      required: [id, show_id, mode, status]
      properties:
        id: { type: string, format: uuid }
        show_id: { type: string, format: uuid }
        mode: { type: string, enum: [live, auto, hybrid] }
        status: { type: string, enum: [scheduled, running, paused, ended] }
        start_time: { type: string, format: date-time }
        end_time: { type: string, format: date-time }
    PlayEventCreate:
      type: object
      required: [episode_id, track_id, played_at, played_ms]
      properties:
        episode_id: { type: string, format: uuid }
        track_id: { type: string, format: uuid }
        played_at: { type: string, format: date-time }
        played_ms: { type: integer, minimum: 0 }
        isrc: { type: string }
    CallerRouteRequest:
      type: object
      required: [action]
      properties:
        action:
          type: string
          enum: [hold, queue, on_air, drop]
        mix_minus_bus: { type: string, example: caller_return_minus_self }
        producer_note: { type: string }
    ShowRunnerModeRequest:
      type: object
      required: [mode]
      properties:
        mode:
          type: string
          enum: [auto, hybrid, manual]
        reason: { type: string }
        effective_at: { type: string, format: date-time }
paths:
  /auth/login:
    post:
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: OK
  /stations:
    get:
      responses:
        '200': { description: OK }
    post:
      responses:
        '201': { description: Created }
  /shows:
    get:
      responses:
        '200': { description: OK }
    post:
      responses:
        '201': { description: Created }
  /episodes/{id}/start:
    post:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '202': { description: Start accepted }
  /episodes/{id}/stop:
    post:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '202': { description: Stop accepted }
  /schedule/publish:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [station_id, window_start, window_end]
              properties:
                station_id: { type: string, format: uuid }
                window_start: { type: string, format: date-time }
                window_end: { type: string, format: date-time }
      responses:
        '202': { description: Publish accepted }
  /tracks/import:
    post:
      responses:
        '202': { description: Import accepted }
  /tracks/{id}:
    patch:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: Updated }
  /plays:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PlayEventCreate'
      responses:
        '201': { description: Created }
  /ads/vast:
    post:
      responses:
        '200': { description: VAST response proxy }
  /ads/impression:
    post:
      responses:
        '202': { description: Beacon accepted }
  /calls/inbound:
    post:
      security: []
      responses:
        '202': { description: Inbound call accepted }
  /calls/{id}/screen:
    post:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: Screened }
  /calls/{id}/route:
    post:
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CallerRouteRequest'
      responses:
        '200': { description: Routed }
  /ai/show_runner/{episode_id}/mode:
    post:
      parameters:
        - name: episode_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ShowRunnerModeRequest'
      responses:
        '200': { description: Mode updated }
```

## 2.3 Webhook schema draft

### Delivery/auth model

- Header signatures:
  - `X-Webhook-Id`: unique event delivery id (UUID)
  - `X-Webhook-Timestamp`: unix epoch seconds
  - `X-Webhook-Signature`: `v1=<hex_hmac_sha256(secret, timestamp + "." + raw_body)>`
- Receiver validation:
  - reject if timestamp age > 5 minutes
  - constant-time signature compare
  - dedupe by `X-Webhook-Id`

### Event envelope

```json
{
  "id": "evt_01J...",
  "type": "episode.started",
  "occurred_at": "2026-05-04T09:00:00Z",
  "station_id": "d47ad2b9-8f6c-4561-8ebf-2f7af9fef501",
  "correlation_id": "req_4f51...",
  "data": {}
}
```

### Event types (P0/P1)

- `episode.started`
- `episode.ended`
- `segment.started`
- `segment.ended`
- `play_event.created`
- `caller.incoming`
- `caller.screened`
- `caller.on_air`
- `moderation.flagged`
- `moderation.actioned`
- `ad.break_started`
- `ad.impression`

### Example payloads

#### `moderation.flagged`

```json
{
  "id": "evt_01JMOD...",
  "type": "moderation.flagged",
  "occurred_at": "2026-05-04T09:13:11Z",
  "station_id": "d47ad2b9-8f6c-4561-8ebf-2f7af9fef501",
  "correlation_id": "mod_8bb2...",
  "data": {
    "episode_id": "cfd5d8ad-b7f2-420f-9cb6-c2c2576c4e32",
    "transcript_id": "tr_45d...",
    "policy": "harassment",
    "score": 0.94,
    "severity": "high",
    "recommended_action": "dump_delay_buffer"
  }
}
```

#### `caller.on_air`

```json
{
  "id": "evt_01JCALL...",
  "type": "caller.on_air",
  "occurred_at": "2026-05-04T09:21:30Z",
  "station_id": "d47ad2b9-8f6c-4561-8ebf-2f7af9fef501",
  "correlation_id": "call_9d2...",
  "data": {
    "call_session_id": "ed4d5bce-0721-4461-9fc1-b48d3f6f8385",
    "participant_id": "prt_3b2...",
    "routed_by": "producer_user_id",
    "mix_minus_profile": "caller_return_minus_self"
  }
}
```

## 2.4 Show-runner tool contract draft

Tool calls should be schema-validated JSON only.

- `schedule_get_window(station_id, from, to)`
- `playout_enqueue(episode_id, asset_id, position)`
- `playout_trigger_talk_break(episode_id, script, tts_profile)`
- `calls_route(call_session_id, action)`
- `metadata_publish_now_playing(episode_id, now_playing)`
- `moderation_get_status(episode_id)`
- `ads_request_break(episode_id, break_profile)`
- `episode_set_mode(episode_id, mode, reason)`

Example tool schema (`playout_trigger_talk_break`):

```json
{
  "name": "playout_trigger_talk_break",
  "description": "Injects an AI talk break into episode playout.",
  "input_schema": {
    "type": "object",
    "required": ["episode_id", "script", "tts_profile"],
    "properties": {
      "episode_id": {"type": "string", "format": "uuid"},
      "script": {"type": "string", "minLength": 20, "maxLength": 2500},
      "tts_profile": {
        "type": "object",
        "required": ["voice_id", "language"],
        "properties": {
          "voice_id": {"type": "string"},
          "language": {"type": "string", "example": "en-AU"},
          "style": {"type": "string"}
        }
      }
    },
    "additionalProperties": false
  }
}
```

---

## 3) Studio App UX Design + Backend Mapping

## 3.1 Information architecture (screens)

1. **On Air (primary presenter view)**
   - Deck A/B, mic channels, beds/jingles, master bus meters.
   - Transport controls: start/stop, crossfade, dump-delay, cough mute.
   - Live “Now Playing” + upcoming queue.

2. **Cue/Prep view**
   - Cue bus headphone routing, waveform seek, prelisten gain.
   - Track analysis: BPM/key/energy + intro/outro markers.

3. **Producer/Caller view**
   - Caller queue, IVR answers, risk score, transcript snippets.
   - Actions: hold, screen complete, on-air, drop.

4. **AI Co-host view**
   - Rundown suggestions, generated break scripts, confidence/citations.
   - Modes: auto/hybrid/manual with one-click override.

5. **Safety/Compliance panel**
   - Delay buffer status, moderation alerts, profanity triggers.
   - Logging indicators for recording and rights metadata completeness.

## 3.2 Signal flow and bus behavior

- **Program bus**: authoritative on-air output to encoder/origin.
- **Cue bus (PFL)**: headphone-only preview; never routed to program bus unless explicitly promoted.
- **Mix-minus for caller**:
  - Caller return = Program bus - caller channel (+optional producer talkback).
  - Prevents echo loops for PSTN/WebRTC participants.
- **Ducking**:
  - Mic/host speech sidechain reduces bed/music channel gain using attack/release profile.

## 3.3 Detailed UI-to-event/API mapping

| UI capability | UX behavior | Backend API | Emitted events/webhooks |
|---|---|---|---|
| Start episode | “Go Live” arms program chain + recording | `POST /episodes/{id}/start` | `episode.started` |
| Stop episode | Graceful stop after current segment | `POST /episodes/{id}/stop` | `episode.ended` |
| Push now playing | Presenter confirms metadata | `POST /plays` + metadata service publish | `play_event.created` |
| Switch AI mode | Toggle auto/hybrid/manual | `POST /ai/show_runner/{episode_id}/mode` | `segment.started` (AI talk), `moderation.*` as needed |
| Route caller on-air | Producer action in queue row | `POST /calls/{id}/route` | `caller.on_air` |
| Screen caller | Label allowed/not-allowed | `POST /calls/{id}/screen` | `caller.screened` |
| Dump delay | Immediate profanity dump action | moderation control endpoint (internal) | `moderation.actioned` |
| Publish ad break marker | Trigger break boundary | `POST /ads/vast` + marker insert | `ad.break_started` |
| Update track ISRC/tag | Edit modal in library panel | `PATCH /tracks/{id}` | `play_event.created` (next play) |
| Publish schedule window | Producer validates conflict-free schedule | `POST /schedule/publish` | downstream scheduler events |

## 3.4 Producer/Caller screen specification

### Caller queue columns

- Caller alias/number
- Wait duration
- IVR reason code
- Consent status (recording consent required)
- Language
- Toxicity risk badge
- Live transcript confidence
- Action buttons: `Hold`, `Screen`, `On Air`, `Drop`

### Interaction states

- `incoming` → `screening` → (`queued` or `rejected`) → `on_air` → `completed`
- Any state can transition to `dropped` by producer or policy engine.

### Real-time events required for UI state

- WebSocket topics:
  - `studio.vu_levels`
  - `studio.bus_routes`
  - `calls.queue.updated`
  - `calls.participant.updated`
  - `moderation.alerts`
  - `show_runner.recommendations`

## 3.5 UX acceptance criteria (implementation-ready)

- **Cue safety**: Cued assets must never leak to program bus without explicit operator action.
- **Latency**: Button-to-audio-route changes under 150 ms inside local studio graph.
- **Recovery**: If control API is temporarily unavailable, local studio keeps deterministic audio routing and replays state sync when reconnected.
- **Accessibility**: Full keyboard operation, visible focus, labeled controls, and screen-reader announcements for routing changes.
- **Auditability**: All high-risk actions (on-air route, dump, AI mode change) persisted with user identity and timestamp.

---

## 4) Recommended default architecture profile (quick start)

For rapid, low-risk implementation:

- **Ingest**: Self-host authenticated RTMP + WHIP edge.
- **Mixer/DSP**: Liquidsoap-first, custom control facade.
- **Origin**: Managed HLS/LL-HLS origin (AWS MediaPackage class) + CDN.
- **AI Host**: Managed LLM/TTS primary path + local fallback options.
- **Telephony**: Twilio for launch, provider abstraction retained.
- **Moderation**: Managed ASR + in-house policy/risk/action engine with delay buffer controls.

This profile balances launch speed, operational reliability, and long-term portability.

# AI Radio Station Product Roadmap

## 1) Product Goals

1. **Authenticity**
   - Deliver host behavior, pacing, and transitions that feel like a live, human-led station while preserving clear AI disclosure.
   - Maintain natural banter, contextual awareness, and coherent show identity across segments.
2. **Autonomy Slider**
   - Provide a clear control model from fully-assisted to fully-automated operation, allowing operators to tune AI initiative by show, slot, or station.
   - Ensure predictable behavior at each autonomy level with transparent override controls.
3. **Reliability**
   - Guarantee stable scheduling, playout continuity, and fail-safe fallbacks under degraded conditions.
   - Meet measurable SLOs for latency, uptime, and recovery to keep station output uninterrupted.
4. **Monetization**
   - Support ad insertion, sponsorship reads, campaign pacing, and inventory reporting without degrading listener experience.
   - Enable revenue controls that align commercial constraints with content and compliance policies.

---

## 2) Epics

### Epic A: Scheduler & Playout Intelligence

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Rule-based + AI-assisted clock generation (music, talk, IDs, ads).
- Dynamic reflow for overruns/underruns.
- Fallback track and segment recovery logic.

**Scope (Out)**
- Third-party label rights management portal.
- Advanced multi-station network syndication orchestration.

**Dependencies**
- Metadata normalization for tracks/segments.
- Queue persistence and conflict resolution.
- Time source synchronization across runtime services.

**Technical Owners**
- Core Automation Lead (primary).
- Backend Runtime Engineer.
- Data/Metadata Engineer.

**Acceptance Criteria**
- 99.9% schedule execution accuracy over rolling 7 days.
- Reflow completes within 2 seconds for timing drift events.
- Fallback engages automatically within 1 second of playout failure.

**Rollback Strategy**
- Revert to static clock templates and deterministic playlist mode.
- Disable AI reflow feature flag.
- Restore previous schedule snapshot from backup.

---

### Epic B: AI Hosts & Show Intelligence

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Persona-configurable host generation (tone, station voice, daypart behavior).
- Context-aware links between songs, news snippets, and promos.
- Operator-defined autonomy slider behavior by program block.

**Scope (Out)**
- Deepfake voice cloning of non-consenting real individuals.
- Open-ended, unmoderated live long-form conversational streams.

**Dependencies**
- Prompt variable management and persona templates.
- Content moderation and policy filters.
- TTS engine stability and voice asset quality.

**Technical Owners**
- AI/LLM Engineer (primary).
- Audio ML Engineer.
- Product Engineer (host tooling UX).

**Acceptance Criteria**
- Host segments pass moderation checks at >= 99.5% precision/recall threshold target.
- Median generation-to-air latency <= 1200 ms.
- Operators can switch autonomy level in under 2 clicks with immediate effect.

**Rollback Strategy**
- Fall back to pre-authored liners and scripted transitions.
- Pin to prior model version.
- Disable dynamic generation while preserving scheduled content flow.

---

### Epic C: Calls & Guest Interaction Layer

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Call screening workflow and queue triage.
- AI-assisted guest intros/outros and topic continuity.
- Latency-safe talkback moderation pipeline.

**Scope (Out)**
- Video call production stack.
- Public social live-stream simulcast moderation tools.

**Dependencies**
- Telephony/SIP integration.
- Real-time transcription and profanity filtering.
- Producer console controls for handoff and dump actions.

**Technical Owners**
- Realtime Communications Engineer (primary).
- Moderation Systems Engineer.
- Broadcast UX Engineer.

**Acceptance Criteria**
- Call connect success rate >= 98%.
- End-to-end call audio delay <= 500 ms (target environment).
- Producer can hard-drop or bleep within configured safety window.

**Rollback Strategy**
- Disable live call intake and revert to voicemail-only segment ingestion.
- Route guest segments to pre-recorded playback path.
- Keep studio safe mode with manual producer-only controls.

---

### Epic D: Ad Stack & Revenue Operations

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Campaign trafficking, slot assignment, and frequency caps.
- Dynamic ad insertion hooks with policy-aware placement.
- Delivery and pacing analytics by campaign/daypart.

**Scope (Out)**
- External DSP bidding marketplace.
- Direct billing and invoicing ERP integration.

**Dependencies**
- Accurate impression/event logging.
- Ad content moderation and legal policy tagging.
- Scheduler integration for break timing guarantees.

**Technical Owners**
- Monetization Platform Engineer (primary).
- Data Engineer (reporting).
- Compliance/Policy Engineer.

**Acceptance Criteria**
- >= 99% eligible ad delivery against campaign constraints.
- Pacing variance <= 5% daily.
- No ad insertions violate content adjacency rules in validation suite.

**Rollback Strategy**
- Revert to static ad carts and manual break assignment.
- Disable dynamic insertion API.
- Restore prior campaign mapping snapshot.

---

### Epic E: Observability & Incident Response

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Centralized logs, metrics, traces, and alerting.
- SLA/SLO dashboards for playout and generation pipeline.
- Incident runbooks and automated health checks.

**Scope (Out)**
- Organization-wide SIEM replacement.
- Long-term cold archival beyond required retention.

**Dependencies**
- Structured event schema across services.
- Log shipping and storage backend.
- On-call rotation and escalation policy.

**Technical Owners**
- SRE/Platform Engineer (primary).
- Backend Lead.
- QA/Release Engineer.

**Acceptance Criteria**
- 100% of critical paths emit structured logs with correlation IDs.
- P1 alerts fire within 60 seconds of outage condition.
- Mean time to detect (MTTD) under 2 minutes in game-day drills.

**Rollback Strategy**
- Revert to baseline monitoring dashboards.
- Disable noisy/new alert rules via config bundle rollback.
- Preserve event ingestion with reduced sampling to protect stability.

---

### Epic F: Compliance, Safety & Governance

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Content policy enforcement (language, claims, disclosures).
- Audit trails for generated content decisions.
- Region-aware legal constraints and retention rules.

**Scope (Out)**
- Legal advisory workflow tooling for counsel collaboration.
- Full enterprise governance suite across non-radio products.

**Dependencies**
- Policy engine and moderation taxonomy.
- Secure key/material handling and access controls.
- Reporting exports for audit requests.

**Technical Owners**
- Trust & Safety Engineer (primary).
- Security Engineer.
- Compliance Program Manager (technical liaison).

**Acceptance Criteria**
- 100% generated segments receive policy classification before air.
- Audit logs retained and queryable per policy retention windows.
- Mandatory disclosure insertion tested across all AI-hosted segments.

**Rollback Strategy**
- Fail closed: block non-compliant generated segments.
- Revert to approved canned content inventory.
- Temporarily require manual producer approval for AI outputs.

---

### Epic G: User Control & Operator Experience

**Traceability**
- [ONLINE_RADIO_DJ_DESIGN.md](./ONLINE_RADIO_DJ_DESIGN.md)
- [ROBODJ_ANALYSIS.md](./ROBODJ_ANALYSIS.md)

**Scope (In)**
- Unified operator controls for autonomy, moderation sensitivity, and emergency overrides.
- Explainability panel for why AI selected specific transitions or content.
- Role-based access controls for producers, admins, and editors.

**Scope (Out)**
- Consumer-facing mobile listener app redesign.
- Full CMS replacement for unrelated station workflows.

**Dependencies**
- Identity/permissions model.
- Runtime config service and low-latency propagation.
- UX instrumentation for operator workflow analytics.

**Technical Owners**
- Frontend/Product Engineer (primary).
- Backend Config Engineer.
- UX Designer (embedded).

**Acceptance Criteria**
- Emergency manual override activation <= 1 second.
- Role permissions enforced on 100% privileged actions in test matrix.
- Operators can inspect last 10 AI decisions with clear reason codes.

**Rollback Strategy**
- Disable advanced controls and expose minimal safe control panel.
- Revert to prior RBAC policy snapshot.
- Lock autonomy to conservative preset until issue resolution.

---

## 3) Milestones by Quarter / Sprint Groups

## Milestone 1: MVP (Q1–Q2 / Sprints 1–6)
- Deliver baseline Scheduler, AI Hosts (limited autonomy), and core Observability.
- Stand up Compliance guardrails and minimal User Control dashboard.
- Enable static + semi-dynamic ad break handling.

**Definition of Done (MVP)**
- [ ] **Latency:** Median host generation latency <= 1500 ms.
- [ ] **Uptime:** Station playout uptime >= 99.5% over 30 days.
- [ ] **Audio Quality:** No clipping/distortion in automated QC sample set; LUFS targets met.
- [ ] **Moderation:** All AI segments pass required policy checks before air.
- [ ] **Logs:** Structured logs available for scheduler, generation, and playout with searchable IDs.

## Milestone 2: Beta (Q3 / Sprints 7–10)
- Expand Calls/Guests feature set and dynamic ad stack capabilities.
- Improve host contextual intelligence and autonomy slider granularity.
- Harden incident response playbooks and compliance reporting.

**Definition of Done (Beta)**
- [ ] **Latency:** P95 end-to-end segment prep + playout readiness <= 2500 ms.
- [ ] **Uptime:** Station playout uptime >= 99.8% over 30 days.
- [ ] **Audio Quality:** MOS target met in blind review and continuity score above threshold.
- [ ] **Moderation:** False-negative policy violations below agreed risk ceiling.
- [ ] **Logs:** End-to-end correlation across ad, host, and call workflows in dashboards.

## Milestone 3: Production (Q4+ / Sprints 11–16)
- Full epic coverage with production-grade reliability, monetization, and governance.
- Multi-role operator controls with robust rollback and safe-mode options.
- Release readiness with SLO tracking, audit readiness, and operational training.

**Definition of Done (Production)**
- [ ] **Latency:** P95 live operation actions (override, reflow, insert) <= 1000 ms control-plane response.
- [ ] **Uptime:** Station playout uptime >= 99.95% over 90 days.
- [ ] **Audio Quality:** Automated + human QA pass rate >= 99% across sampled broadcasts.
- [ ] **Moderation:** Policy compliance SLO achieved with documented exception workflow.
- [ ] **Logs:** Retention, redaction, and audit export requirements validated in production drills.

---

## 4) Epic-to-Milestone Mapping

- **MVP:** Scheduler, AI Hosts (core), Observability (core), Compliance (baseline), User Control (minimal), Ad Stack (static/semi-dynamic).
- **Beta:** Adds Calls/Guests, Ad Stack (dynamic), AI Hosts (advanced contextual), Compliance (reporting depth), Observability (incident automation).
- **Production:** All epics at full reliability/commercial scale with hardened rollback and governance controls.

---

## 5) KPI Instrumentation, Correlation, and Reporting

### 5.1 KPI Metric Collection Sources

| KPI | Control-Plane Sources | Generation Sources | Playout Sources | Moderation Sources |
|---|---|---|---|---|
| Latency | Scheduler API request/ack timestamps; override/reflow event timings | LLM request start/end, TTS render durations, asset packaging completion | Queue commit timestamp, deck-load timestamp, on-air marker emit time | Pre-air moderation enqueue/dequeue timings; policy decision latency |
| Uptime | Health-check success rates for scheduler/config/routing services | Generation worker availability and job timeout/error rates | Encoder/stream heartbeat, silence detector alarms, playout engine process health | Moderation service availability and fail-closed activation events |
| Audio Quality | Control actions that alter gain/processing presets (with reason code) | TTS output metadata (sample rate/bit depth), normalization stage pass/fail | Real-time loudness meter (LUFS), peak clipping counters, continuity gap events | Post-moderation audio redaction/replacement events and fallback audio triggers |
| Moderation | Policy version deployment events; ruleset activation/rollback logs | Prompt + model policy tags attached to generated segment metadata | On-air release gate decisions and manual override actions | Classifier scores, pass/fail decision, reviewer disposition, exception workflow artifacts |
| Logs | API gateway structured logs, scheduler decisions, control actions | Generation pipeline structured events (request, transform, synthesize, publish) | Playout structured events (queue, start, end, failover, recovery) | Moderation policy/evaluation structured events, appeal/review audit logs |

### 5.2 Structured Correlation ID Standard

Adopt a shared correlation contract across scheduler -> generation -> playout:

- `trace_id`: Global request lineage ID created at scheduler ingress (UUIDv7).
- `segment_id`: Stable segment identity used across retries/reflows.
- `run_id`: Unique execution attempt for each segment lifecycle.
- `airchain_id`: Playout-chain instance linking queue slot, deck action, and encoder state.
- `policy_eval_id`: Moderation evaluation run ID tied to `segment_id` and policy version.

**Required propagation path**
- Scheduler emits `trace_id`, `segment_id`, `run_id` at plan/create/reflow events.
- Generation consumes upstream IDs and appends `generation_stage` (`prompt`, `llm`, `tts`, `postprocess`).
- Playout consumes upstream IDs and appends `airchain_id`, `playout_state` (`queued`, `loaded`, `on_air`, `completed`, `failed`).
- Moderation binds `policy_eval_id` and must reference parent `trace_id` + `segment_id`.

**Minimum structured log payload fields (all services)**
- `timestamp_utc`, `service`, `environment`, `trace_id`, `segment_id`, `run_id`, `event_type`, `event_state`, `status`, `latency_ms`, `error_code`, `operator_id` (when human action exists).

### 5.3 Dashboard and Reporting Definitions

#### A) Latency Dashboard (P50/P95)
- **Views**
  - End-to-end segment latency: scheduler accept -> playout ready.
  - Stage latency: scheduler decision, generation, moderation gate, playout load.
- **Aggregations**
  - P50 and P95 by 5-minute, 1-hour, and 24-hour windows.
  - Sliced by daypart, show, autonomy level, and content type (music intro, ad read, call segment).
- **Alert thresholds**
  - MVP: P50 > 1500 ms for 3 consecutive 5-minute buckets.
  - Beta: P95 > 2500 ms for 2 consecutive 15-minute buckets.
  - Production: control-plane P95 > 1000 ms for 2 consecutive 5-minute buckets.

#### B) Uptime Dashboard (Windowed SLA/SLO)
- **Views**
  - Rolling playout availability for 24h, 7d, 30d, and 90d windows.
  - Service contribution heatmap (control-plane, generation, playout, moderation) to downtime budget.
- **Availability formula**
  - `uptime_percent = (total_window_seconds - confirmed_downtime_seconds) / total_window_seconds * 100`.
  - Confirmed downtime excludes scheduled maintenance windows tagged in incident metadata.
- **Alert thresholds**
  - MVP: projected 30-day uptime drops below 99.5%.
  - Beta: projected 30-day uptime drops below 99.8%.
  - Production: projected 90-day uptime drops below 99.95%.

### 5.4 QA Sampling Workflow (Audio Quality + Moderation Evidence)

1. **Sampling schedule**
   - Randomly sample at least 2% of daily AI-generated segments, stratified by daypart and show type.
   - Force-include all segments with moderation confidence near threshold or any failover/recovery events.
2. **Audio quality review**
   - Automated checks: LUFS compliance, peak clipping count, continuity/silence gap detection.
   - Human review panel (weekly): MOS and transition coherence rubric.
3. **Moderation review**
   - Record automated pass/fail result, classifier confidence, triggered policy categories.
   - Human adjudication on sampled passes + all fails with final disposition (`confirmed_pass`, `false_positive`, `false_negative`).
4. **Evidence capture**
   - Persist evidence bundle per sampled segment: audio excerpt reference, transcript snapshot, policy result, reviewer notes, and correlation IDs.
   - Store bundles under retention policy with exportable audit packet format.
5. **Escalation and closure**
   - Any `false_negative` or severe audio defect creates corrective action ticket with owner + ETA.
   - Weekly QA report summarizes pass/fail rates, defect taxonomy, and remediation status.

### 5.5 Observable Done Criteria (KPI-Gated)

Use the following as release gate evidence for each milestone; each item is complete only when metric threshold + dashboard proof + log evidence are present.

**MVP Done Gates**
- [ ] Latency: P50 end-to-end <= 1500 ms over rolling 7 days, visible in latency dashboard.
- [ ] Uptime: >= 99.5% over rolling 30 days from uptime dashboard formula.
- [ ] Audio Quality: >= 98% sampled segments pass LUFS/clipping/continuity checks and weekly human QA rubric.
- [ ] Moderation: 100% AI segments receive pre-air policy decision; sampled false-negative rate <= 0.5%.
- [ ] Logs: >= 99% critical events include `trace_id`, `segment_id`, and `run_id` across scheduler/generation/playout.

**Beta Done Gates**
- [ ] Latency: P95 end-to-end <= 2500 ms over rolling 14 days.
- [ ] Uptime: >= 99.8% over rolling 30 days.
- [ ] Audio Quality: >= 99% sampled segments pass automated checks and MOS target in weekly blind review.
- [ ] Moderation: false-negative rate <= agreed risk ceiling and all fails have reviewer disposition evidence.
- [ ] Logs: End-to-end correlation query from scheduler -> moderation -> playout succeeds for >= 99% sampled traces.

**Production Done Gates**
- [ ] Latency: P95 control-plane actions <= 1000 ms over rolling 30 days.
- [ ] Uptime: >= 99.95% over rolling 90 days.
- [ ] Audio Quality: >= 99% combined automated + human QA pass rate across stratified samples.
- [ ] Moderation: policy compliance SLO met with documented exception workflow and closure times within SLA.
- [ ] Logs: retention/redaction/audit exports validated with successful drill outputs tied to correlation IDs.

# RoboDJ Feature-Heavy Roadmap TODO (Release Plan)

This roadmap translates the feature backlog into a release-by-release plan with priority, effort, and dependencies.

## Planning assumptions
- Cadence: ~6-week releases.
- Scope labels:
  - **Must**: commit-critical for the release goal.
  - **Should**: strong value, can slip if risk appears.
  - **Could**: stretch goals.
- Effort scale per item: **S / M / L**.

---

## v1.1 — Reliability & Safety Baseline
**Goal:** make daily operation safer and easier to recover.

### Must
- [x] Startup diagnostics panel (DB checks, key checks, audio device checks) **(M)**
- [x] Config validator on launch for `schedules.json` and `prompt_variables.json` **(M)**
- [x] Crash-recovery flow with “restore last known good config” **(M)**
- [x] One-click config backup snapshot (timestamped) **(S)**

### Should
- [ ] Structured log viewer (ERROR/WARN/INFO + date filter) **(M)**
- [ ] “Safe mode” boot toggle (disable non-critical automations) **(S)**

### Could
- [ ] Backup rotation policy (keep N daily/weekly snapshots) **(S)**

### Dependencies
- Requires consistent config schema definitions.
- Backup path conventions in `config/backups/`.

### Exit criteria
- Operator can recover from a bad config change in under 2 minutes.
- Invalid JSON/config references are blocked before runtime failures.

### Implementation acceptance criteria
- Launch sequence fails closed when `config/schedules.json` or `config/prompt_variables.json` fails validation.
- Latest `config/backups/config_snapshot_YYYYMMDD_HHMMSS/` can be restored via one command in under 2 minutes.

---

## v1.2 — Scheduling 2.0
**Goal:** improve scheduling power and reduce operator workload.

### Must
- [ ] Visual weekly scheduler timeline (drag/drop blocks) **(L)**
- [ ] Conflict detector with actionable suggestions **(M)**
- [ ] Reusable schedule templates (weekday/weekend/overnight) **(M)**

### Should
- [ ] Holiday and special-event override calendar **(M)**
- [ ] Per-show profile presets (voice, pacing, bed defaults) **(M)**

### Could
- [ ] Bulk schedule edit mode (copy/paste between days) **(S)**

### Dependencies
- Builds on v1.1 config validation and backup.
- Requires normalized schedule schema to support templates/overrides.

### Exit criteria
- New weekly schedule setup time reduced by ~50%.
- Schedule conflicts are surfaced before save/publish.

---

## v1.3 — Prompt Intelligence & Content Quality
**Goal:** make generated content more consistent and controllable.

### Must
- [ ] Prompt template manager with version history + rollback **(M)**
- [ ] Prompt variable preview/render tool with sample data **(M)**
- [ ] Content guardrails (tone rules, banned terms, compliance checks) **(M)**

### Should
- [ ] A/B prompt testing with side-by-side scoring workflow **(L)**
- [ ] Persona library (station voice packs + tone presets) **(M)**

### Could
- [ ] Continuity memory for recurring segments **(L)**

### Dependencies
- Needs v1.1 config/version safety for rollback confidence.
- Guardrails require policy source-of-truth format.

### Exit criteria
- Prompt rollback can be done per template without DB edits.
- Operators can preview 100% of variable substitutions before run.

---

## v1.4 — Audio Production Pipeline
**Goal:** improve output polish and reduce manual post-processing.

### Must
- [ ] Segment composer workflow (intro, talk break, transition, outro) **(L)**
- [ ] Loudness normalization + auto-ducking pipeline **(L)**
- [ ] Preview-before-publish rendering flow **(M)**

### Should
- [ ] Smart music bed recommendation (mood/tempo/category) **(M)**
- [ ] Jingle/SFX library with tag-based lookup **(M)**

### Could
- [ ] Crossfade strategy presets (smooth/punchy/broadcast) **(S)**

### Dependencies
- Requires stable metadata model for audio asset tags.
- May need caching strategy for fast previews.

### Exit criteria
- Default output levels meet target loudness profile.
- Producer can audition composed segments before publish.

---

## v1.5 — Library, Search, and Scale
**Goal:** make large media/content libraries manageable.

### Must
- [ ] Unified media/content browser with fast faceted filters **(M)**
- [ ] Advanced search syntax (AND/OR/range/exclude) **(M)**
- [ ] Duplicate detection for media and generated segments **(M)**

### Should
- [ ] Bulk metadata editor (multi-select operations) **(M)**
- [ ] Smart crates/playlists (rule-driven dynamic collections) **(M)**

### Could
- [ ] Auto-archive stale assets + cache pruning policy **(S)**

### Dependencies
- Requires consistent indexing strategy.
- Benefits from prior tagging improvements in v1.4.

### Exit criteria
- Search returns relevant assets in sub-second time for typical datasets.
- Duplicate issues are detected before publish.

---

## v1.6 — Integrations & Operations
**Goal:** make RoboDJ extensible and production-operable.

### Must
- [ ] Webhook trigger support (start/switch/inject actions) **(M)**
- [ ] Notifications to Discord/Slack for failures and milestones **(S)**
- [ ] Health dashboard with alert thresholds **(M)**

### Should
- [ ] Optional REST API for orchestration **(L)**
- [ ] Import/export profile bundles between machines **(M)**

### Could
- [ ] Cloud backup sync adapter **(M)**

### Dependencies
- Requires secure key handling and audit logging plan.
- Alerting needs stable event taxonomy from logs.

### Exit criteria
- External systems can trigger key automation paths reliably.
- Operators receive actionable alerts within minutes of failure.

---

## v2.0 — Enterprise Readiness & Governance
**Goal:** complete governance, access control, and release confidence.

### Must
- [ ] Role-based access control (admin/operator/view-only) **(L)**
- [ ] Immutable audit trail for prompt/schedule/config changes **(L)**
- [ ] Dry-run simulation mode for full-day schedule validation **(L)**

### Should
- [ ] Secret rotation reminders + key integrity checks **(M)**
- [ ] Stable/beta channel rollout controls **(M)**

### Could
- [ ] Plugin SDK alpha with one reference extension **(L)**

### Dependencies
- Builds on integration event model from v1.6.
- Requires explicit permissions model and user identity handling.

### Exit criteria
- Access restrictions and change attribution are enforced end-to-end.
- Full day simulation can run pre-air to catch schedule/content errors.

---

## Cross-release workstreams (continuous)
- [ ] Performance profiling and startup-time reduction.
- [ ] DB maintenance helpers (vacuum/analyze/reindex workflow).
- [ ] Accessibility and UX polish (themes, keyboard workflows, readability).
- [ ] Documentation refresh per release, including operator runbooks.

## Prioritization snapshot

This snapshot provides a cross-release view of priority, highlighting the most critical themes regardless of their target release.
- **P0:** Reliability, backup/recovery, conflict detection, diagnostics.
- **P1:** Scheduler UX, prompt versioning/guardrails, audio normalization.
- **P2:** Library intelligence, integrations, operations dashboard.
- **P3:** Enterprise governance extras, SDK ecosystem.

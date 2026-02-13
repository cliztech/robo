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

### Current Sprint (v1.1 Now)

#### Ticket R11-01 — Startup diagnostics panel
- **Owner:** Desktop App Engineer
- **Estimate:** 5 days (M)
- **Dependency:** Reusable health-check functions for DB, key files, and audio device discovery.
- **Scope:** Add a launch-time diagnostics panel that reports pass/fail/warn for DB availability, key integrity, and audio output readiness before automation starts.
- **Acceptance criteria:**
  - Diagnostics panel appears automatically during startup and can be reopened from the main UI.
  - DB, key, and audio checks each report status with clear remediation guidance.
  - Startup flow blocks automation start on hard-fail checks and allows continue on warnings.
- **Definition of done:** Feature is merged with QA evidence showing pass/warn/fail states and operator can act on each status without reading logs.

#### Ticket R11-02 — Launch-time config validator (`schedules.json`, `prompt_variables.json`)
- **Owner:** Configuration/Runtime Engineer
- **Estimate:** 4 days (M)
- **Dependency:** Stable JSON schema definitions and a shared validation utility.
- **Scope:** Validate `config/schedules.json` and `config/prompt_variables.json` on launch and prevent runtime start when either file is invalid.
- **Acceptance criteria:**
  - Validator runs before scheduler/prompt execution begins.
  - Invalid JSON, missing required keys, and type mismatches are surfaced with file + line context.
  - Validation errors provide one-click open path to the offending config file location.
- **Definition of done:** Invalid configs are consistently blocked at launch, and known-good sample configs pass validation in automated checks.

#### Ticket R11-03 — Crash recovery with restore-last-known-good
- **Owner:** Reliability Engineer
- **Estimate:** 6 days (M)
- **Dependency:** Backup snapshot writer and startup crash-state detector.
- **Scope:** Detect unclean shutdowns and present a guided restore flow to recover config files from the latest known-good snapshot.
- **Acceptance criteria:**
  - App detects prior crash/unclean exit and offers recovery on next launch.
  - Restore flow lists available snapshots with timestamp and source metadata.
  - Operator can restore last known good config in one action and confirm recovery success before continuing.
- **Definition of done:** Simulated crash scenario recovers to an operable state in under 2 minutes using only in-app recovery prompts.

#### Ticket R11-04 — One-click timestamped backup snapshot
- **Owner:** Platform/Tooling Engineer
- **Estimate:** 2 days (S)
- **Dependency:** Backup directory convention in `config/backups/` and manifest format for snapshot contents.
- **Scope:** Add a one-click/manual action that writes timestamped snapshots of critical config files to `config/backups/`.
- **Acceptance criteria:**
  - Backup action is available from settings/operations menu and returns success/failure feedback.
  - Snapshot directory names are timestamped and collision-safe.
  - Snapshot includes `schedules.json`, `prompt_variables.json`, and relevant launcher/runtime config artifacts.
- **Definition of done:** Operator can create and verify a timestamped snapshot without CLI usage, and restored files match snapshot checksums.

### Must
- [ ] Startup diagnostics panel (DB checks, key checks, audio device checks) **(M)**
- [ ] Config validator on launch for `schedules.json` and `prompt_variables.json` **(M)**
- [ ] Crash-recovery flow with “restore last known good config” **(M)**
- [ ] One-click config backup snapshot (timestamped) **(S)**

### Current Sprint (v1.1 Now)

#### Ticket V11-01 — Startup Diagnostics Panel
- **Owner:** App Core (Runtime)
- **Estimate:** M (4-5 dev days)
- **Dependency:** Existing startup pipeline + read-only DB/key/audio probe helpers.
- **Acceptance criteria:**
  - On every app launch, a diagnostics panel renders startup checks for DB reachability, key-file presence, and audio device availability.
  - Each check returns a clear status (`pass`, `warn`, `fail`) with a human-readable remediation hint.
  - Launch blocking behavior is enforced only for hard-fail checks (e.g., DB unavailable), while warn-level checks allow continue.
  - Diagnostics results are written once per startup to logs for support triage.
- **Definition of done:** Merged with startup diagnostics UI + probe wiring, test evidence for pass/warn/fail states, and operator notes added to release docs.

#### Ticket V11-02 — Launch-Time Config Validator
- **Owner:** Config & Validation
- **Estimate:** M (3-4 dev days)
- **Dependency:** Canonical schema definitions for `schedules.json` and `prompt_variables.json`.
- **Acceptance criteria:**
  - App startup validates both `config/schedules.json` and `config/prompt_variables.json` before runtime automations initialize.
  - Validation checks include JSON parse, required keys, value types, and cross-reference integrity where applicable.
  - Validation failures are surfaced in UI with file-level and field-level error locations.
  - Invalid config blocks normal startup path and offers recovery actions (open file location / restore backup).
- **Definition of done:** Validator integrated into launch gate with actionable error output, schema test cases committed, and startup block behavior verified.

#### Ticket V11-03 — Crash Recovery (Restore Last Known Good)
- **Owner:** Reliability & Recovery
- **Estimate:** M (4-5 dev days)
- **Dependency:** Backup snapshot mechanism + startup validator integration.
- **Acceptance criteria:**
  - After abnormal termination, next launch detects crash context and prompts recovery options.
  - Operator can restore the most recent valid snapshot in one flow without manual file surgery.
  - Recovery flow validates restored files before relaunching normal operations.
  - Recovery action and source snapshot metadata are recorded to logs for auditability.
- **Definition of done:** Crash marker detection, guided restore workflow, and validated relaunch path all shipped with a tested happy path and rollback path.

#### Ticket V11-04 — One-Click Timestamped Backup Snapshot
- **Owner:** Config & Platform Utilities
- **Estimate:** S (1-2 dev days)
- **Dependency:** Backup path conventions in `config/backups/`.
- **Acceptance criteria:**
  - Operator can trigger a manual backup snapshot via single action from the app surface.
  - Snapshot creates a timestamped backup artifact for targeted config files (`schedules.json`, `prompt_variables.json`, and related runtime JSON files).
  - Backup operation reports success/failure immediately and logs backup path.
  - Snapshot naming format is deterministic and collision-safe for repeated operations in the same day.
- **Definition of done:** One-click backup flow is available and logged, snapshot files are verified in `config/backups/`, and restore compatibility is confirmed.

### Should
- [ ] Structured log viewer (ERROR/WARN/INFO + date filter) **(M)**
- [ ] “Safe mode” boot toggle (disable non-critical automations) **(S)**

### Could
- [ ] Backup rotation policy (keep N daily/weekly snapshots) **(S)**
- [ ] Accessibility preset framework (high contrast, large text, reduced motion, simplified workspace density) **(M)**

### Dependencies
- Requires consistent config schema definitions.
- Backup path conventions in `config/backups/`.

### Exit criteria
- Operator can recover from a bad config change in under 2 minutes.
- Invalid JSON/config references are blocked before runtime failures.
- Accessibility preset selection persists across restart with no manual file edits.

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

---

## v1.2 — Scheduling 2.0
**Goal:** improve scheduling power and reduce operator workload.

### Scheduler UX contracts (v1.2 delivery baseline)
- **Drag/drop snap granularity**
  - Day and week timeline views snap to **15-minute increments** by default.
  - Operators can temporarily refine snapping to **5-minute increments** with a modifier key.
  - Start/end resize handles use the same snap grid as drag operations.
- **Overlap/conflict visualization (color + icon states)**
  - **No conflict**: neutral/brand block color with no alert icon.
  - **Soft conflict (rule warning)**: amber/yellow stripe and warning-triangle icon.
  - **Hard conflict (double-booking/airtime collision)**: red fill and error-octagon icon.
  - Hover/focus tooltips must explain conflict cause and suggested resolution.
- **Keyboard operations (accessibility)**
  - Arrow keys move focused block by one snap unit; `Shift+Arrow` resizes by one snap unit.
  - `Ctrl/Cmd+D` duplicate selected block(s); `Delete/Backspace` removes selected block(s) with confirmation when destructive.
  - `Tab`/`Shift+Tab` traverse blocks and controls in visual order with clear focus indicators.
- **Undo/redo behavior**
  - Support multi-step history (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`) for drag, resize, delete, paste, template apply, and conflict-resolution actions.
  - Undo/redo history is session-scoped and must preserve selection context when possible.
  - Publish action is blocked while history replay is in progress.
- **Multi-select and copy/paste patterns**
  - Multi-select via `Shift+Click`, marquee drag, and `Ctrl/Cmd+Click` additive selection.
  - `Ctrl/Cmd+C` and `Ctrl/Cmd+V` copy/paste within day or across days, preserving relative offsets and metadata.
  - Pasted blocks enter a preview state until confirmed; any generated conflicts are highlighted before commit.

### Acceptance criteria (conflict resolution + error prevention)
- Conflict detection and visualization updates must render within **<=200 ms p95** after drag/drop, resize, or paste interactions.
- From conflict banner interaction to resolved state, operator workflow must complete within **<=3 clicks/keystrokes** for common collisions.
- Publish must be hard-blocked when unresolved hard conflicts exist.
- Publish confirmation must show a preflight summary of warnings and conflicts prevented, requiring explicit operator acknowledgment.
- System must prevent accidental destructive edits via undo support and confirmation prompts for delete/publish actions.

### Must
- [ ] Visual weekly scheduler timeline (drag/drop blocks) **(L)**
- [ ] Conflict detector with actionable suggestions **(M)**
- [ ] Reusable schedule templates (weekday/weekend/overnight) **(M)**

### Should
- [ ] Holiday and special-event override calendar **(M)**
- [ ] Per-show profile presets (voice, pacing, bed defaults) **(M)**
- [ ] Keyboard-first schedule editing workflow (navigate, edit, save, conflict resolution) **(M)**

### Could
- [ ] Bulk schedule edit mode (copy/paste between days) **(S)**

### Dependencies
- Builds on v1.1 config validation and backup.
- Requires normalized schedule schema to support templates/overrides.

### Exit criteria
- New weekly schedule setup time reduced by ~50%.
- Schedule conflicts are surfaced before save/publish.
- Schedule editor is fully usable from keyboard under large text and simplified density presets.

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

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
- [ ] Keyboard-first prompt approval workflow (open, approve, request changes, next pending) **(S)**

### Could
- [ ] Continuity memory for recurring segments **(L)**

### Dependencies
- Needs v1.1 config/version safety for rollback confidence.
- Guardrails require policy source-of-truth format.

### Exit criteria
- Prompt rollback can be done per template without DB edits.
- Operators can preview 100% of variable substitutions before run.
- Prompt approval pipeline supports keyboard-only operation in high contrast and reduced motion presets.

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

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
- [ ] Keyboard-first queue control workflow (focus queue, reorder, hold/release, start next) **(S)**

### Could
- [ ] Crossfade strategy presets (smooth/punchy/broadcast) **(S)**

### Dependencies
- Requires stable metadata model for audio asset tags.
- May need caching strategy for fast previews.

### Exit criteria
- Default output levels meet target loudness profile.
- Producer can audition composed segments before publish.
- Queue control workflow passes keyboard-only checks with large text and simplified density presets enabled.

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

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

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

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

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

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

### Release Candidate gate
- Apply **Required Before Release Candidate** from `PRE_RELEASE_CHECKLIST.md` before cutting the RC; all gate items are signed by the **Release Manager**.

---

## Cross-release workstreams (continuous)
- [ ] Performance profiling and startup-time reduction.
- [ ] DB maintenance helpers (vacuum/analyze/reindex workflow).
- [ ] Accessibility and UX polish (themes, keyboard workflows, readability).
- [ ] Define and maintain default focus order + ARIA landmarks for dashboard and studio pages.
- [ ] Add preset-specific acceptance checks to release sign-off (high contrast, large text, reduced motion, simplified density).
- [ ] Documentation refresh per release, including operator runbooks.

## Accessibility preset acceptance matrix (release gate)

Every release with UI changes must pass these checks, not only generic audit completion:

- [ ] **High contrast preset:** critical controls and text in dashboard/studio meet contrast targets; focus indicators remain clearly visible.
- [ ] **Large text preset:** no clipping/overlap in top navigation, sidebar, queue controls, scheduler cells, and prompt approval actions.
- [ ] **Reduced motion preset:** route transitions, panel transitions, and list updates use reduced-motion variants with no continuous decorative loops.
- [ ] **Simplified workspace density preset:** operator-critical actions stay above the fold and primary targets maintain larger hit areas.
- [ ] **Keyboard-first workflows:** queue control, schedule edits, and prompt approvals complete without pointer interaction in each preset.
- [ ] **Landmark and focus order:** dashboard and studio use consistent landmarks and deterministic tab order for top-level tasks.

## Prioritization snapshot

This snapshot provides a cross-release view of priority, highlighting the most critical themes regardless of their target release.
- **P0:** Reliability, backup/recovery, conflict detection, diagnostics.
- **P1:** Scheduler UX, prompt versioning/guardrails, audio normalization.
- **P2:** Library intelligence, integrations, operations dashboard.
- **P3:** Enterprise governance extras, SDK ecosystem.

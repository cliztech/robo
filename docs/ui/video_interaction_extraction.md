# Video Interaction Extraction for DJ Reference Clips

Status: draft  
Audience: design/frontend/QA  
Goal: translate observed DJ tutorial interaction behavior into implementation-ready tasks for DGN-DJ radio operations.

## Source Videos (`images/*.mp4`)

1. `images/Using AUTOMIX to Auto TRANSITION - virtual DJ 2023 tutorials.mp4`
2. `images/Virtual DJ 2025 is Here_ Master the New StemSwap Sampler Feature! (Virtual DJ tutorials).mp4`
3. `images/Virtual DJ 2026 is Finally HERE! + Download Links.mp4`
4. `images/Virtual DJ 2026 – INSANE New Features You Must Try!.mp4`

---

## 1) `Using AUTOMIX to Auto TRANSITION - virtual DJ 2023 tutorials.mp4`

### Timestamped observations

| Timestamp | Interaction triggered | Visual feedback timing | State transition pattern | Recoverability / error behavior |
| --- | --- | --- | --- | --- |
| 00:00-00:20 | User opens Automix controls and points to transition menu. | Dropdown/panel appears near-instantly (<120ms perceived). | Idle -> Automix config open -> option hover. | Safe to close/reopen without losing deck play state. |
| 01:35-01:55 | Transition mode changed while playlist is loaded. | Highlight state updates in same frame as click (target <=100ms). | Previous mode active -> mode switch pending -> mode confirmed. | Re-selection is immediate; no destructive side effects shown. |
| 02:30-02:55 | User previews/arms automatic transition behavior. | Active banner/selection emphasis appears quickly (<150ms). | Manual deck prep -> automix armed -> playback handoff. | User can fall back to manual controls if outcome is poor. |
| 03:55-04:14 | Reopens transition area to refine behavior during playback. | Panel returns without layout jump (<120ms). | Running automix -> config tweak -> updated policy applied next transition. | Non-blocking edits; no hard-stop UI error shown. |

### Implementation task mapping

| Task | Target component path | Expected animation/latency bounds | Keyboard parity requirements |
| --- | --- | --- | --- |
| Add Automix policy picker with explicit active state and staged apply behavior. | `src/components/shell/module-dock.tsx` | Open/close <=120ms fade; selection confirmation <=100ms. | `Ctrl+Shift+A` open dock, arrow keys navigate modes, `Enter` apply, `Esc` close. |
| Build transition-mode chips with deterministic active/queued labels. | `src/components/shell/deck-panel.tsx` | Chip state flip <=80ms; no slide animation. | Tab focus order left-to-right, `Space/Enter` toggles chip. |
| Add non-blocking “revert to manual” action when Automix confidence is low. | `src/components/shell/mixer-panel.tsx` | Warning badge appears <=120ms; revert action <=100ms response. | Dedicated shortcut `M` (while panel focused) for manual takeover. |

### Radio adaptation flags (do not copy 1:1)

- DJ-style transition presets should be reframed as **radio-safe handoff profiles** (e.g., “clean segue,” “voice-safe dip”), not club blend styles.
- Avoid exposing jargon-heavy labels; radio ops needs plain-language operator outcomes.

---

## 2) `Virtual DJ 2025 is Here_ Master the New StemSwap Sampler Feature! (Virtual DJ tutorials).mp4`

### Timestamped observations

| Timestamp | Interaction triggered | Visual feedback timing | State transition pattern | Recoverability / error behavior |
| --- | --- | --- | --- | --- |
| 00:00-00:25 | User introduces StemSwap/Sampler context with focused panel callout. | Overlay/callout appears immediately (<150ms). | Neutral deck view -> feature spotlight -> panel focus. | Spotlight can be dismissed with no state mutation. |
| 01:35-02:05 | Sample is triggered on active deck (explicit “trigger on currently playing deck” guidance). | Trigger indication lights instantly (<=80ms). | Deck active -> sample armed -> sample playing. | Wrong deck trigger is visibly reversible by retriggering on correct deck. |
| 04:45-05:20 | Sampler/stem selection list is changed while transport continues. | List selection and icon state update <=100ms. | Current sample set -> set selection -> new pad mapping active. | No transport interruption; mapping changes are recoverable. |
| 06:20-07:00 | User demonstrates good vs bad triggering patterns (X/✔ visual coaching). | Comparison overlays render quickly (<120ms). | Ambiguous workflow -> explicit best-practice pattern. | Instructive guardrail style suggests soft prevention over hard errors. |
| 08:00-08:19 | Feature recap and repeat of deck-awareness rule. | Recap overlay appears with no interaction lag. | Active interaction -> summary guidance -> return to normal view. | End-state remains operable; no lock-in mode. |

### Implementation task mapping

| Task | Target component path | Expected animation/latency bounds | Keyboard parity requirements |
| --- | --- | --- | --- |
| Add “active output lane” indicator before allowing sample/sting trigger. | `src/components/shell/deck-panel.tsx` | Indicator pulse <=100ms (single pulse only). | `Tab` to lane indicator; `Enter` confirms lane before trigger. |
| Implement guardrail copy for wrong-context trigger attempts (soft block + fix action). | `src/components/shell/module-dock.tsx` | Error hint appears <=120ms; dismiss <=80ms. | `Esc` dismiss hint; `Alt+R` retry on recommended lane. |
| Support live remapping of sample banks without transport interruption. | `src/components/shell/library-browser.tsx` | Mapping switch <=120ms; no page reflow. | `Ctrl+1..9` select banks; arrow keys move pads; `Enter` audition/assign. |

### Radio adaptation flags (do not copy 1:1)

- Replace stem/performance language with **imaging/station element** terminology (stinger, bed, sweeper).
- Enforce stricter accidental-trigger prevention than DJ workflows because radio automation runs long unattended blocks.

---

## 3) `Virtual DJ 2026 is Finally HERE! + Download Links.mp4`

### Timestamped observations

| Timestamp | Interaction triggered | Visual feedback timing | State transition pattern | Recoverability / error behavior |
| --- | --- | --- | --- | --- |
| 00:35-01:05 | User opens plugin/effect selection modal from deck area. | Modal appears quickly (<150ms), focus moves into list. | Deck view -> modal open -> category browsing. | Modal close returns prior context reliably. |
| 01:20-01:50 | Effect slot assignment/update is performed. | Slot icon and slot label update <=100ms. | Empty slot -> effect selected -> slot armed. | Slot can be replaced without stopping playback. |
| 02:10-02:40 | Visual effect panel previewed while browsing plugin set. | Preview panel swaps instantly (<=120ms). | Effect browse -> preview -> selected effect state. | User can back out before commit; no destructive writes seen. |
| 03:00-03:40 | Repeated plugin list navigation and assignment. | Repeated interactions stay responsive (<120ms each). | Iterate browse/assign loop with persistent context. | No crash or freeze pattern observed during repeated edits. |

### Implementation task mapping

| Task | Target component path | Expected animation/latency bounds | Keyboard parity requirements |
| --- | --- | --- | --- |
| Build effect/plugin chooser dialog with strong focus management and reversible apply. | `src/components/shell/module-dock.tsx` | Dialog open/close <=150ms fade only; selection <=100ms. | Initial focus on search; arrows navigate; `Enter` apply; `Esc` cancel. |
| Add slot assignment row with explicit “pending/active” state badges. | `src/components/shell/mixer-panel.tsx` | Badge change <=80ms; no movement animation. | `Tab` through slots, `Space` toggles pending apply, `Enter` commit. |
| Add non-disruptive preview mode for effects before live commit. | `src/components/shell/deck-panel.tsx` | Preview activation <=120ms; timeout rollback <=200ms after cancel. | `P` preview toggle while slot focused; `Backspace` cancel preview. |

### Radio adaptation flags (do not copy 1:1)

- Video FX-heavy interaction should map to **audio processing and compliance-safe processing presets**, not visual-only effects.
- Radio mode must default to conservative DSP transitions to avoid audible artifacts on-air.

---

## 4) `Virtual DJ 2026 – INSANE New Features You Must Try!.mp4`

### Timestamped observations

| Timestamp | Interaction triggered | Visual feedback timing | State transition pattern | Recoverability / error behavior |
| --- | --- | --- | --- | --- |
| 00:30-01:00 | New feature showcase opens with panel/feature jump cuts. | Feature callouts update immediately; scene cuts are editorial, not UI latency. | Baseline UI -> highlighted module -> next module. | Demonstration implies modular isolation (features can be entered/exited safely). |
| 01:45-02:20 | AI lyrics/metadata style panel appears in deck context. | Panel render perceived <=150ms; text appears progressively. | Deck playback -> AI panel open -> contextual content shown. | If content is not useful, user can dismiss and continue mixing. |
| 02:20-02:50 | Settings/preferences dialog navigated for feature toggles. | Tree/list navigation feels immediate (<=100ms each click). | Default settings -> category select -> toggle updates. | Toggle actions look reversible with no forced restart. |

### Implementation task mapping

| Task | Target component path | Expected animation/latency bounds | Keyboard parity requirements |
| --- | --- | --- | --- |
| Add feature-discovery rail for new radio capabilities with dismissible hints. | `src/components/shell/app-shell.tsx` | Hint enter/exit <=120ms opacity only. | `F6` cycle discovery hints; `Esc` dismiss current hint. |
| Add contextual AI assistant panel with strict non-blocking behavior. | `src/components/shell/module-dock.tsx` | Panel mount <=150ms; async content placeholder <=80ms. | `Ctrl+.` opens assistant; full keyboard navigation for actions. |
| Implement settings toggle groups with instant local apply + undo affordance. | `src/components/shell/library-browser.tsx` | Toggle response <=100ms; undo toast <=120ms. | `Space` toggles focused setting; `Ctrl+Z` undo last toggle. |

### Radio adaptation flags (do not copy 1:1)

- “Try this now” novelty prompts should be throttled during live automation windows.
- AI text features should prioritize concise operator decision support, not entertainer-facing novelty overlays.

---

## Motion budget (functional vs decorative)

### Functional motion (allowed)

Use motion only when it improves state comprehension or reduces operator error:

- Focus ring transitions for keyboard navigation (<=80ms).
- Active/armed badge color transitions (<=80ms).
- Dock/dialog open-close fades for context switching (<=120-150ms).
- Single-pulse attention cue for critical misroute/wrong-lane warnings (<=100ms, one cycle).

### Decorative motion (minimize or remove)

- No continuous panel bobbing, parallax, or glowing loops in live operation surfaces.
- No slide-in choreography for dense operator controls.
- No celebratory animation for successful routine actions (load, assign, toggle).

### Enforcement rules

1. Default all non-functional animations to `0ms` in “On Air” and “High Focus” modes.
2. Any animation above `150ms` requires a documented functional rationale.
3. Concurrent animated elements on primary operator surface must stay <=2.
4. Respect reduced-motion preference by replacing all non-essential transitions with instant state swaps.

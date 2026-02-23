# DJ Console Initiative Quality Gates

Status: active  
Applies to: release advancement for DJ Console UI increments  
Sources merged: `docs/ui/dj_console_ui_research_plan.md` ("Perfect = measurable"), `docs/visual_regression_token_checklist.md`, and accessibility guardrails in `REACT_BROWSER_UI_TEAM_BLUEPRINT.md`.

## Rekordbox 7 Review Baseline

Use this baseline when triaging quality issues so fixes move the UI toward a Rekordbox 7-style operator experience (dense, precise, low-latency, and immediately scannable) without copying proprietary branding.

### Rekordbox-style review dimensions

Score each dimension `Pass` / `At Risk` / `Fail` during every UI quality review:

1. **Information density fidelity**
   - Operator-critical controls are visible above the fold at 1280x720.
   - Deck, mixer, and browser zoning is obvious in one glance.
2. **Contrast and hierarchy discipline**
   - Functional hierarchy is created through tone/contrast and separators, not decorative effects.
   - Active deck/state accents are strong but limited to actionable states.
3. **Control precision and tactile clarity**
   - Faders, knobs, transport buttons, and cue states have unambiguous affordances.
   - Labels remain legible under dense layouts and accessibility profiles.
4. **Waveform and timing readability**
   - Waveform rails, playheads, and markers are readable with clear A/B differentiation.
   - Timing telemetry (BPM, phase/key/time) uses stable numeric rendering.
5. **Low-motion, high-feedback interaction feel**
   - State changes feel immediate; animation is secondary and short-lived.
   - Reduced-motion mode preserves equivalent clarity and response confidence.


### Rekordbox-style scoring rubric (required)

Use the 5-point rubric below for each dimension to reduce subjective reviews.

| Score | Meaning | Release interpretation |
| --- | --- | --- |
| 5 | Matches target operator feel with no notable friction. | Safe; no follow-up required. |
| 4 | Minor polish gap, no task risk. | Pass with tracked follow-up. |
| 3 | Noticeable quality gap that slows scanability or confidence. | At risk; fix before Ready-for-Review. |
| 2 | Material usability issue affecting speed/clarity for core flows. | Fail; blocks gate progression. |
| 1 | Critical breakdown of hierarchy, readability, or control confidence. | Fail; immediate remediation required. |

**Release threshold:**

- No dimension may score below **4** for release candidate.
- Any dimension at **3** must have an owner + due date before Ready-for-Review.
- Any dimension at **1-2** is an automatic gate fail.

### Rekordbox-style review packet template

Attach this compact packet to every visual/UX quality review:

```md
#### Rekordbox-style review packet

- Scope: <deck/mixer/waveform/browser/utility>
- Reviewer: <name>
- Build/artifact: <commit, branch, preview link>

| Dimension | Score (1-5) | Notes | Evidence |
| --- | --- | --- | --- |
| Information density fidelity |  |  |  |
| Contrast and hierarchy discipline |  |  |  |
| Control precision and tactile clarity |  |  |  |
| Waveform and timing readability |  |  |  |
| Low-motion, high-feedback interaction feel |  |  |  |

- Decision: `approved` / `needs-rework` / `blocked`
- Gate impact: <gate numbers impacted>
- Follow-ups: <owner + due date>
```

### Mandatory design-review artifacts for quality issues

Every quality issue tagged as visual/UX must include:

- Before/after screenshots with the impacted review dimension(s) called out.
- A short design rationale describing how the change improves Rekordbox-style scanability or control confidence.
- Any token/component adjustments mapped to impacted shell zones (deck, mixer, waveform, browser, utilities).
- Reviewer disposition (`approved`, `needs-rework`, `blocked`) and next action owner.

## Gate Policy

- A release increment can advance only when **all gates pass**.
- Each gate requires linked evidence artifacts (test output, screenshots, profiling data).
- Missing evidence is treated as a **fail**, even if implementation appears complete.

## Gate 1 — Visual density and hierarchy fidelity

**Intent:** Keep the DJ-console visual rhythm (high information density, strict grouping, immediate scannability) while preserving accessibility profiles.

### Pass criteria

- Layout regions remain recognizable and stable across supported resolutions (minimum 1280x720, target 1920x1080).
- Typography, spacing, and token use match approved density/hierarchy expectations for module headers, transport controls, waveform region, and browser tables.
- Visual hierarchy remains clear in all accessibility profiles (`default`, `high_contrast`, `large_text`, `reduced_motion`, `simplified_density`).
- Review output explicitly records the Rekordbox-style dimension scores for density and hierarchy.

### Fail conditions

- Controls collapse into ambiguous groupings or lose deck/mixer/browser hierarchy.
- Density changes hide critical controls or produce clipped labels in any profile.
- Token drift introduces inconsistent panel depth, accent usage, or unreadable contrast states.

### Required evidence links

- Side-by-side screenshots (baseline vs current) for each profile + 1280x720 and 1920x1080 checkpoints.
- Visual review checklist output mapped to token groups and hierarchy targets.

## Gate 2 — Transport/control response times

**Intent:** Preserve the "immediate response" behavior expected for transport, tempo, cue, and mixer interactions.

### Pass criteria

- Control input-to-visible-state-update latency is within defined budget for transport and high-frequency controls.
- No interaction class exceeds the declared frame/perf budget under representative load.
- Keyboard-triggered and pointer-triggered actions show equivalent response timing behavior.

### Fail conditions

- Any transport/control action exceeds latency budget or exhibits repeatable lag/jank.
- Visible state confirmation depends on delayed animation rather than immediate state reflection.
- Performance regressions are introduced relative to approved baseline profile data.

### Required evidence links

- Profiling traces and timing summary (input event to painted state) for play/pause, cue, tempo, and volume/fader interactions.
- Benchmark log output from perf checks with baseline comparison.

## Gate 3 — Keyboard completeness and focus visibility

**Intent:** Meet keyboard-first operation and deterministic focus behavior across shell, deck, mixer, browser, and overlays.

### Pass criteria

- All primary operator tasks are fully executable by keyboard.
- Focus order remains deterministic and matches shell contract order.
- Focus indicators remain visible and high-contrast in all accessibility profiles.
- Overlay focus trap/restore behavior works consistently with `Escape` and documented shortcuts.

### Fail conditions

- Any primary flow requires pointer-only interaction.
- Focus can be lost, hidden, or trapped incorrectly when routing, opening overlays, or switching tabs.
- `high_contrast` profile weakens focus affordances below expected visibility.

### Required evidence links

- Keyboard traversal test output covering core operator workflows.
- Accessibility test report (including focus visibility checks) with pass/fail matrix by profile.
- Screenshots or short captures showing visible focus in key surfaces.

## Gate 4 — Reduced-motion parity

**Intent:** Ensure reduced-motion mode is fully functional, not a degraded experience.

### Pass criteria

- `prefers-reduced-motion` and in-app `reduced_motion` profile remove transform-heavy motion and continuous decorative loops.
- State changes remain understandable via non-motion cues (iconography, labels, status text).
- Functional behavior parity is maintained between default and reduced-motion profiles.

### Fail conditions

- Reduced-motion mode still uses transform/parallax/auto-scroll behaviors beyond accepted limits.
- Essential state feedback depends on motion cues alone.
- Feature functionality diverges between default and reduced-motion profiles.

### Required evidence links

- Motion audit output (default vs reduced-motion) for shell transitions, tabs, scheduler timeline, and overlays.
- Screenshots and/or recordings proving parity for key flows in reduced-motion profile.

## Gate 5 — Regression snapshot coverage

**Intent:** Enforce regression evidence breadth for tokens, components, and critical workflows.

### Pass criteria

- Snapshot set covers all critical UI regions and interaction states identified in the visual regression checklist.
- Token-sensitive surfaces (color, spacing, typography, states) have regression baselines and current captures.
- Accessibility profiles and key breakpoints are represented in regression artifacts.

### Fail conditions

- Missing snapshots for critical regions, states, breakpoints, or accessibility profiles.
- Snapshot drift is accepted without explicit triage and sign-off.
- Regression run output is incomplete or not reproducible.

### Required evidence links

- Snapshot run report with artifact index.
- Diff review log with explicit disposition for each visual change.
- Updated baseline references (only when approved) linked to review decision.

## Release Advancement Rule

Before moving an increment to Ready-for-Review or release candidate, provide a gate checklist with direct links for every required evidence item above.

- If **any gate** fails or evidence is missing: release advancement is blocked.
- If all gates pass with complete evidence: release advancement may proceed.

## Quality-Issue Remediation Format (Required)

When filing or resolving a DJ console quality issue, use this structure:

1. **Issue statement:** what feels off versus Rekordbox-style expectations.
2. **Impacted surface:** deck/mixer/waveform/browser/utility shell region.
3. **Broken review dimensions:** list from the five Rekordbox-style dimensions above.
4. **Design correction:** specific visual/interaction changes proposed.
5. **Evidence:** links to screenshots, test output, and profiling artifacts.
6. **Gate impact:** which gate(s) this issue blocks or unlocks.

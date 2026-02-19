# GUI Parity Rubric

## Purpose
Use this rubric to evaluate parity between baseline and updated GUI implementations for DJ workflows. The score is split into visual and functional tracks to prevent strong aesthetics from masking operational regressions.

## Scoring Model

### Weighted tracks
- **Visual parity:** 40% of total score
- **Functional parity:** 60% of total score

### Calculation
1. Score each criterion on a 0-5 scale.
2. Compute each track score as:
   - `(sum of criterion scores / max criterion score total) * 100`
3. Compute final weighted score:
   - `final = (visual_score * 0.40) + (functional_score * 0.60)`

## Pass Thresholds
A parity review passes only when all thresholds are met:
- **Visual parity >= 80%**
- **Functional parity >= 85%**
- **Final weighted score >= 85%**
- **No blocker defects** on critical path scenarios

## Track A: Visual Parity (40%)
Evaluate visual alignment with baseline behavior and design expectations.

| Criterion | Description | Score (0-5) |
|---|---|---|
| Layout fidelity | Panel placement, spacing patterns, and structural alignment match expected layout. |  |
| Density alignment | Information density and control spacing support equivalent scan speed and operation. |  |
| Contrast and legibility | Text/icon contrast, state visibility, and readability meet accessibility and baseline expectations. |  |
| Visual hierarchy | Primary actions, status indicators, and key telemetry are clearly prioritized. |  |
| Consistency | Reused controls, states, tokens, and interaction affordances remain visually consistent. |  |

## Track B: Functional Parity (60%)
Evaluate operational behavior under realistic DJ tasks.

| Criterion | Description | Score (0-5) |
|---|---|---|
| Discoverability | Core features are easy to find without hidden/ambiguous navigation. |  |
| Control response | UI controls react reliably with clear, timely feedback. |  |
| Workflow efficiency | Core workflows complete in equivalent or fewer steps/time than baseline. |  |
| Error recovery | Invalid actions return actionable guidance and allow quick recovery. |  |

## Required Test Scenarios
Run and score each scenario as part of every parity assessment:
1. **Load track** into an active deck.
2. **Cue track** and confirm cue state feedback.
3. **Sync decks** and verify sync indicators and behavior.
4. **Transition decks** (crossfade or equivalent) and verify continuity.
5. **Browse/filter library** and locate a target track.
6. **Trigger sampler** and verify launch/stop control behavior.
7. **Recover from invalid action** (e.g., transition without loaded track) and confirm error handling.

## Required Evidence Package
Attach all evidence below to the parity review:

### 1) Before/After screenshots
- Before screenshot(s): baseline UI state for each required scenario.
- After screenshot(s): updated UI state at matching checkpoints.
- Naming format: `scenario-<name>-before.png` and `scenario-<name>-after.png`.

### 2) Short interaction capture
- One short capture (GIF/video) per parity cycle, covering at least one complete end-to-end workflow.
- Duration target: 15-60 seconds.
- Include visible timestamp/build identifier overlay when possible.

### 3) Scenario checklist with defect linkage
Record outcomes using this template:

| Scenario | Pass/Fail | Notes | Defect ID(s) |
|---|---|---|---|
| Load track |  |  |  |
| Cue track |  |  |  |
| Sync decks |  |  |  |
| Transition decks |  |  |  |
| Browse/filter library |  |  |  |
| Trigger sampler |  |  |  |
| Recover from invalid action |  |  |  |

- Use `N/A` only when scenario is genuinely out of scope for the surface under review.
- Every failed scenario must include at least one defect ID.

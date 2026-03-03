# GUI BMAD Startup Packet Runbook

## Purpose
Define the **minimal** command sequence, required inputs, and expected outputs for GUI-focused BMAD startup requests.

## Input Template (fill before execution)
- **Problem statement:**
  - What user/operator problem is being solved?
  - What workflow is currently blocked or too slow?
- **Platform constraints:**
  - Runtime platform(s):
  - Performance constraints (latency/startup/memory):
  - Security/compliance constraints:
  - Dependency/stack constraints:
- **Target screen sizes:**
  - 1280x720 requirements:
  - 1920x1080 requirements:
  - Any additional breakpoints:
- **Interaction model:**
  - Primary input mode (keyboard-first, mouse, touch):
  - Core user journeys:
  - Error/recovery flows:
  - Accessibility expectations:

## Minimal Command Sequence
Run in this exact order:

1. `bmad-party-mode`
2. `bmad-bmm-create-ux-design`
3. `bmad-bmm-create-architecture` *(only if implementation constraints are needed)*

## Expected Outputs by Command

### 1) `bmad-party-mode`
- **Expected output:** startup packet and route confirmation for BMAD execution.
- **Target artifacts:**
  - `docs/planning_artifacts/*` (session packet, scope framing, constraints summary)

### 2) `bmad-bmm-create-ux-design`
- **Expected output:** UX design package with screen, flow, and accessibility intent.
- **Target artifacts:**
  - `docs/ui/*` (screen specs, flows, interaction notes)
  - `docs/planning_artifacts/*` (design rationale, acceptance criteria draft)

### 3) `bmad-bmm-create-architecture` *(conditional)*
- **Expected output:** implementation-aware architecture brief when UX requires technical constraints.
- **Target artifacts:**
  - `docs/planning_artifacts/*` (architecture constraints, system boundaries, handoff notes)

## Acceptance Gates
All gates must pass before handing work to implementation teams:

1. **Keyboard-first operability**
   - Primary workflows executable without mouse dependency.
   - Focus order and shortcut model documented.

2. **Accessibility presets**
   - Presets addressed (e.g., high contrast, larger text, reduced motion, simplified density).
   - UI behaviors and exceptions documented.

3. **Visual hierarchy/readability at 1280x720 and 1920x1080**
   - Information density and priority remain clear at both target sizes.
   - No critical clipping/overflow for core workflows.

4. **Handoff readiness for implementation teams**
   - Artifacts include clear scope, constraints, acceptance criteria, and dependency notes.
   - Implementation team can start without clarification loops.

## Definition of Done
- Input template completed.
- Command sequence executed in order.
- Required artifacts present in target paths.
- All acceptance gates explicitly marked pass/fail with notes.

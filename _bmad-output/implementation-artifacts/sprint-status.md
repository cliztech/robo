---
command: "bmad-bmm-sprint-status"
date: "2026-02-23"
route_confirmed: "bmm / 4-implementation"
status_source: "_bmad-output/implementation-artifacts/sprint-status.yaml"
---

# Sprint Status Route Confirmation

## Route check
- **Executed route:** `bmad-bmm-sprint-status`
- **Mapped phase:** `4-implementation`
- **Prior step confirmed:** `bmad-bmm-sprint-planning`

## Snapshot
- Canonical status artifact: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Scope policy: open + dependency-ready only from `TODO.md` and `FEATURE_HEAVY_ROADMAP_TODO.md`
- Epics tracked: **2**
- Stories tracked: **21**
- Backlog stories: **21**

## Next command sequence
1. `bmad-bmm-create-story` (start with `todo-01-create-tracked-issues-track-a-b-c-d`)
2. `bmad-bmm-create-story` (validate mode for each prepared story)
3. `bmad-bmm-dev-story`
4. `bmad-bmm-code-review`
5. `bmad-bmm-qa-automate` (when test automation is applicable)
6. `bmad-bmm-retrospective` (at epic boundary)
7. `bmad-bmm-sprint-status` (refresh after each completed story)

## Route guardrail
- If any selected item loses dependency-ready status, run `bmad-bmm-correct-course` before continuing.

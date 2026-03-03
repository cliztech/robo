---
title: "BMAD Sprint Plan — Open + Dependency-Ready"
command: "bmad-bmm-sprint-planning"
date: "2026-02-23"
source_files:
  - TODO.md
  - FEATURE_HEAVY_ROADMAP_TODO.md
output_location: "_bmad-output/implementation-artifacts"
---

# Sprint Plan (Open + Dependency-Ready Tickets)

## Selection rules applied
1. Ticket/task is currently open (`[ ]`) in source files.
2. Dependency is either not listed (treated as ready), or explicitly unblocked in-source.
3. Items with unresolved future-release dependency prerequisites were excluded.

## Sequence with owners, verification gates, and rollback expectations

| Seq | Source ticket/task | Owner (source) | Dependency-ready evidence | Verification gate | Rollback expectation |
|---:|---|---|---|---|---|
| 1 | Create tracked issues for all Track A/B/C/D tasks | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | All Track A/B/C/D tasks have linked issue IDs. | Revert issue creation batch and restore prior tracker snapshot. |
| 2 | Add role-aware settings visibility model (`admin`, `operator`, `viewer`) | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Role visibility matrix passes for admin/operator/viewer scenarios. | Disable role-visibility gate and restore previous settings visibility behavior. |
| 3 | Implement idle timeout + re-auth requirements for sensitive actions | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Sensitive actions require valid re-auth after idle timeout. | Revert timeout enforcement and restore previous session controls. |
| 4 | Implement key-rotation workflow CLI + operator checklist integration | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Rotation CLI dry-run succeeds and checklist references match workflow. | Revert CLI/checklist changes and restore previous rotation procedure docs. |
| 5 | Add redaction policy contract tests for logs/API responses | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Redaction denylist contract tests pass for logs/API fixtures. | Remove failing contract gate and restore last known-good redaction baseline. |
| 6 | Add a pre-release security gate in release documentation | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Security gate present in release checklist and marked mandatory. | Revert release checklist edit to prior approved version. |
| 7 | Add human-in-the-loop checkpoints for high-impact decisions | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | High-impact actions require explicit checkpoint approval. | Disable checkpoint gating and return to previous action flow. |
| 8 | Add task route templates (QA / Change / Proposal) | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Route templates published and linked in active operator flow. | Revert template insertions and restore previous routing section. |
| 9 | Add one-click rollback assistant for config-level changes | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Rollback action restores last known-good config consistently. | Disable rollback assistant entrypoint and retain manual restore path. |
| 10 | Add guided troubleshooting for schedules/personas/autonomy policies | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Troubleshooting flow covers top failure categories end-to-end. | Revert troubleshooting flow and restore previous static guidance. |
| 11 | Publish operator guides by persona (Admin, Producer, Reviewer) | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Persona guides published and cross-linked from main docs index. | Restore prior single-guide format. |
| 12 | Build runbook index for common failures | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Runbook index resolves all listed links and top failure scenarios. | Revert runbook index and restore previous navigation structure. |
| 13 | Define support triage workflow + SLA targets | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Triage flow + SLA targets documented with ownership handoffs. | Revert triage/SLA additions and restore previous support policy text. |
| 14 | Document packaging tiers and feature-gate boundaries | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Packaging tier matrix matches feature-gate boundaries. | Revert packaging tier docs to prior release baseline. |
| 15 | Define telemetry ethics + opt-in policy | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Policy includes explicit opt-in/out states and operator instructions. | Revert policy changes and restore previous telemetry policy version. |
| 16 | Weekly: update readiness percentages by category | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Readiness scorecard updated and date-stamped. | Revert incorrect weekly update entry and restore previous scorecard state. |
| 17 | Bi-weekly: remove blocked items or split oversized tasks | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Blocked/oversized tasks are split or clearly deferred with notes. | Undo task split/defer edits and restore prior backlog grouping. |
| 18 | Monthly: reassess roadmap variation (Security-first, UX-first, Scale-first, Balanced) | **TBD** (not assigned in `TODO.md`) | No dependency listed in source task. | Monthly strategy reassessment logged with decision rationale. | Revert monthly reassessment note if inconsistent with active roadmap. |
| 19 | Implement drag/drop weekly timeline using normalized blocks from scheduler API | **TBD** (no owner listed for this subsection) | v1.2 backend foundation prerequisites marked complete (`[x]`) and UI scope explicitly marked unblocked post-foundation. | Timeline renders normalized blocks correctly from scheduler API state. | Disable drag/drop layer and fall back to read-only timeline rendering. |
| 20 | Surface conflict objects inline with fix actions from backend response | **TBD** (no owner listed for this subsection) | v1.2 backend foundation prerequisites marked complete (`[x]`) and UI scope explicitly marked unblocked post-foundation. | Conflict objects + fix actions map to backend conflict payloads. | Revert inline conflict rendering and use existing conflict list fallback. |
| 21 | Add keyboard parity for move/resize/resolve actions in timeline editor | **TBD** (no owner listed for this subsection) | v1.2 backend foundation prerequisites marked complete (`[x]`) and UI scope explicitly marked unblocked post-foundation. | Keyboard-only move/resize/resolve path completes without pointer. | Disable keyboard parity feature flag and retain pointer-only path. |

## Excluded this planning run
- Completed (`[x]`) tasks.
- Future-release tasks with dependencies stated but not yet evidenced complete in-source (for example v1.3+ sections).

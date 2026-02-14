# RoboDJ TODO List

This checklist converts the roadmap into a single execution board with clear priorities.

## Now (current focus)

- [ ] Build v1.1 startup diagnostics panel (DB, key integrity, audio device checks).
- [ ] Enforce launch-time config validation for `config/schedules.json` and `config/prompt_variables.json`.
- [ ] Implement crash recovery with a guided "restore last known good" flow.
- [ ] Add one-click timestamped config backup snapshots in `config/backups/`.

## Next (after v1.1 stability)

### v1.2 Scheduler UX & Control
- [ ] Implement visual weekly scheduler timeline with drag/drop blocks.
- [ ] Surface conflict detection with actionable suggestions.
- [ ] Provide reusable schedule templates (`weekday`, `weekend`, `overnight`).
- [ ] Add holiday/special-event override calendar.
- [ ] Add per-show profile presets (voice, pacing, bed defaults).
- [ ] Add keyboard-first schedule editing workflow.

### v1.3 Prompt Intelligence & Content Quality
- [ ] Build prompt template manager with version history and rollback.
- [ ] Add prompt variable preview/render tool with sample data.
- [ ] Add content guardrails (tone rules, banned terms, compliance checks).
- [ ] Add A/B prompt testing workflow with side-by-side scoring.
- [ ] Add persona library (station voice packs and tone presets).
- [ ] Add keyboard-first prompt approval workflow.

## Later (stretch goals)

- [ ] Add bulk schedule edit mode (copy/paste between days).
- [ ] Add continuity memory for recurring segments.
- [ ] Add advanced publish preflight insights and optimization hints.

## Operational checks per completed item

- [ ] Run `git status --short` and `git diff --name-only` before commit.
- [ ] Run validation for touched JSON: `python -m json.tool <file> > /dev/null`.
- [ ] Run config validation when config behavior changes: `python config/validate_config.py`.
- [ ] Update release notes/checklists when acceptance criteria are met.

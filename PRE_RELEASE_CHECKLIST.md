# Pre-release Checklist

## Run order (exact command sequence)

Run the following commands in order before release sign-off.

1. `python config/validate_config.py`  
   Expected output string: `Configuration validation passed for schedules.json and prompt_variables.json.`
2. `python config/check_runtime_secrets.py --require-env-only`  
   Expected output string: `Secret integrity check passed (key material redacted).`
3. `ts=$(date +%Y%m%d_%H%M%S)`
4. `mkdir -p config/backups/$ts`
5. `cp config/schedules.json config/prompt_variables.json config/backups/$ts/`  
   Expected output string: _(no output; command exits successfully)_
6. `python -c "from pathlib import Path; p=Path('config/logs/autonomy_audit_events.jsonl'); p.parent.mkdir(parents=True, exist_ok=True); p.touch(exist_ok=True); open(p,'a',encoding='utf-8').write('{\"event\":\"pre_release_write_check\"}\n'); print('OK:', p)"`  
   Expected output string: `OK: config/logs/autonomy_audit_events.jsonl`
7. `latest=$(ls -1dt config/backups/* 2>/dev/null | head -n1); echo "$latest"; ls -la "$latest"`  
   Expected output string: `config/backups/<timestamp>`
8. `echo cp "$latest"/schedules.json config/schedules.json && echo cp "$latest"/prompt_variables.json config/prompt_variables.json`  
   Expected output string: `cp config/backups/<timestamp>/...`
9. `cp "$latest"/schedules.json config/schedules.json && cp "$latest"/prompt_variables.json config/prompt_variables.json`  
   Expected output string: _(no output; command exits successfully)_
10. `python config/validate_config.py`  
    Expected output string: `Configuration validation passed for schedules.json and prompt_variables.json.`

---

## Baseline gates (always)

### A. Configuration + secret integrity

- [ ] **Config schema validation passes.**  
  Command: `python config/validate_config.py`  
  Canonical expected output: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] **Runtime secret preflight passes.**  
  Command: `python config/check_runtime_secrets.py --require-env-only`  
  Canonical expected output: `Secret integrity check passed (key material redacted).`
- [ ] **Negative validation behavior is confirmed.**  
  Command sequence:
  1. `cp config/schedules.json config/backups/schedules.pre_validation_gate.json`
  2. `printf '{"broken": true' > config/schedules.json`
  3. `python config/validate_config.py`
  4. `mv config/backups/schedules.pre_validation_gate.json config/schedules.json`

  Canonical expected output from step 3: `Configuration validation failed:`
- [ ] **Secret hygiene check is clean in staged changes.**  
  Commands:
  - `git diff --cached --name-only`
  - `git diff --cached | rg -n -i '(api[_-]?key|secret|token|password|private[_-]?key)'`
  - `git ls-files | rg -n -i '(secret|token|password|private_key|\.key$)'`

  Canonical expected output: no real credential material appears in staged diff output.

### B. Backup, audit-log path, and rollback readiness

- [ ] **Timestamped backup exists for changed config files.**  
  Commands:
  - `ts=$(date +%Y%m%d_%H%M%S)`
  - `mkdir -p config/backups/$ts`
  - `# The branch 'main' should be replaced with your repository's default branch if different.`
  - `git diff --name-only main... HEAD -- 'config/*.json' | xargs -I {} cp -- {} "config/backups/$ts/"`

  Canonical expected output: A backup for each changed `.json` file in `config/` exists in the new timestamped backup directory.
- [ ] **Autonomy audit-log write path is writable.**  
  Command: `python config/scripts/check_audit_log_writable.py`
  Canonical expected output: `OK: config/logs/autonomy_audit_events.jsonl`
- [ ] **Latest snapshot is discoverable and complete.**  
  Command: `latest=$(ls -1dt config/backups/* 2>/dev/null | head -n1); echo "$latest"; ls -la "$latest"`  
  Canonical expected output: `config/backups/<timestamp>` followed by listing including schedule/prompt backup files.
- [ ] **Rollback commands resolve correctly (dry run).**  
  Command: `echo cp "$latest"/schedules.json config/schedules.json && echo cp "$latest"/prompt_variables.json config/prompt_variables.json`  
  Canonical expected output: `cp config/backups/<timestamp>/...`
- [ ] **Rollback drill executes and re-validates.** *(staging/non-production only)*  
  Commands:
  - `cp "$latest"/schedules.json config/schedules.json && cp "$latest"/prompt_variables.json config/prompt_variables.json`
  - `python config/validate_config.py`

  Canonical expected output (step 2): `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] **Backup/restore contract conformance is verified.**  
  Contract: `config/BACKUP_RESTORE_CONTRACT.md`

### C. Operator startup preflight behavior

- [ ] **Launcher validation gate behavior is verified.**  
  Command: `./RoboDJ_Launcher.bat`  
  Canonical expected output (success path): `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] **Blocked-start behavior is verified for failed validation.**  
  Canonical expected output strings:
  - `Configuration validation failed:`
  - `Fix the fields above, then rerun: python config/validate_config.py`
  - `[RoboDJ] ERROR: Startup blocked because configuration validation failed.`
- **Checklist owner:** ____________________
- **Sign-off (name + date/time):** ____________________
## Launcher workflow pre-run gate (all release paths)

Run this command before **every** launcher-based release path (`dev -> staging`, `staging -> prod`, and hotfix redeploys):

- [ ] `python config/check_runtime_secrets.py --require-env-only`
- [ ] Confirm output: `Secret integrity check passed (key material redacted).`
- [ ] Confirm no fallback secret files were used outside explicitly approved local dev/break-glass scenarios.

## Baseline gates (run every release)

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Run runtime secret preflight: `python config/check_runtime_secrets.py --require-env-only`
- [ ] Confirm secret preflight output is: `Secret integrity check passed (key material redacted).`
- [ ] Review and enforce [Codex Environment Contract](docs/operations/codex_environment_contract.md) (required vars, source priority, and redaction rules).
- [ ] Confirm protected runtime flags are set: `ROBODJ_PROTECTED_ENV=true` and `ROBODJ_ALLOW_FILE_SECRET_FALLBACK` is unset/false.
- [ ] Confirm no real key material exists in `config/secret.key` or `config/secret_v2.key` on release runners.
- [ ] If validation fails, confirm output starts with: `Configuration validation failed:` and lists actionable field-level errors.
- [ ] Archive config backups in `config/backups/` for any risky config changes.

---

## Version gates

## v1.1 gates — Reliability & Safety Baseline

Roadmap cross-links: [v1.1 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v11--reliability--safety-baseline) · [v1.1 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-1) · [v1.1 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria) · [v1.1 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate)

### v1.1 Must gates

- [ ] **Startup diagnostics panel checks are all PASS before startup completion.**  
  Command: `./RoboDJ_Launcher.bat`  
  Canonical expected output: `database=PASS`, `key_integrity=PASS`, `audio_device=PASS`
- [ ] **Launch-time config validator blocks malformed JSON and allows valid JSON.**  
  Command: `python config/validate_config.py`  
  Canonical expected output (pass): `Configuration validation passed for schedules.json and prompt_variables.json.`  
  Canonical expected output (blocked invalid): `Configuration validation failed:`
- [ ] **Crash recovery restores last-known-good config snapshot.**  
  Command: `latest=$(ls -1dt config/backups/* 2>/dev/null | head -n1); cp "$latest"/schedules.json config/schedules.json && cp "$latest"/prompt_variables.json config/prompt_variables.json && python config/validate_config.py`  
  Canonical expected output: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] **One-click timestamped backup snapshot is created before risky edits.**  
  Command: `ts=$(date +%Y%m%d_%H%M%S); mkdir -p config/backups/$ts; cp config/schedules.json config/prompt_variables.json config/backups/$ts/; echo "$ts"`  
  Canonical expected output: `<timestamp>`

### v1.1 Exit criteria gates

- [ ] **Recovery-time SLO passes.**  
  Canonical expected output: `t_recover <= 120s`
- [ ] **Validation-block gate passes (invalid config cannot proceed to runtime).**  
  Canonical expected output: `Configuration validation failed:`

## v1.2 gates — Scheduling 2.0

Roadmap cross-links: [v1.2 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v12--scheduling-20) · [v1.2 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-2) · [v1.2 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-1) · [v1.2 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-1)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - New weekly schedule setup time reduced by ~50%.
  - Conflicts surfaced before save/publish.

## v1.3 gates — Prompt Intelligence & Content Quality

Roadmap cross-links: [v1.3 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v13--prompt-intelligence--content-quality) · [v1.3 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-3) · [v1.3 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-2) · [v1.3 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-2)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - Per-template rollback works without DB edits.
  - 100% variable substitutions previewable before run.

## v1.4 gates — Audio Production Pipeline

Roadmap cross-links: [v1.4 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v14--audio-production-pipeline) · [v1.4 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-4) · [v1.4 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-3) · [v1.4 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-3)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - Default output meets target loudness profile.
  - Producer can audition composed segments before publish.

## v1.5 gates — Library, Search, and Scale

Roadmap cross-links: [v1.5 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v15--library-search-and-scale) · [v1.5 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-5) · [v1.5 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-4) · [v1.5 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-4)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - Typical search response stays sub-second.
  - Duplicate issues detected before publish.

## v1.6 gates — Integrations & Operations

Roadmap cross-links: [v1.6 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v16--integrations--operations) · [v1.6 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-6) · [v1.6 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-5) · [v1.6 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-5)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - External triggers execute key automation paths reliably.
  - Actionable alerts arrive within minutes of failure.

## v2.0 gates — Enterprise Readiness & Governance

Roadmap cross-links: [v2.0 heading](FEATURE_HEAVY_ROADMAP_TODO.md#v20--enterprise-readiness--governance) · [v2.0 Must](FEATURE_HEAVY_ROADMAP_TODO.md#must-7) · [v2.0 Exit criteria](FEATURE_HEAVY_ROADMAP_TODO.md#exit-criteria-6) · [v2.0 Release Candidate gate](FEATURE_HEAVY_ROADMAP_TODO.md#release-candidate-gate-6)

- [ ] All **Must** items are demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria are validated with reproducible runbook evidence:
  - Access controls + attribution enforced end-to-end.
  - Full-day simulation catches schedule/content errors before air.
## Startup Preflight Failure Runbook

When launching via `RoboDJ_Launcher.bat`, startup now runs config validation before opening the app.

1. If preflight fails, startup is blocked and the launcher prints:
   - `Configuration validation failed:`
   - One or more ` - [target] ...` error lines with JSON paths and expected values/types.
   - `Fix the fields above, then rerun: python config/validate_config.py`
   - `[RoboDJ] ERROR: Startup blocked because configuration validation failed.`
2. Fix only the reported config fields (`config/schedules.json`, `config/prompt_variables.json`).
3. Re-run `python config/validate_config.py` until the expected success string appears exactly:
   - `Configuration validation passed for schedules.json and prompt_variables.json.`
4. Relaunch using `RoboDJ_Launcher.bat`.
- [ ] Verify backup/restore operations align with `config/BACKUP_RESTORE_CONTRACT.md` (scope, retention, confirmations, rollback).

## Startup preflight behavior (operator runbook)

- `RoboDJ_Launcher.bat` now runs `config/validate_config.py` and `config/check_runtime_secrets.py --require-env-only` before launching the app.
- Startup continues only when validation prints:
  `Configuration validation passed for schedules.json and prompt_variables.json.`
- If validation fails, startup is blocked and the launcher keeps the actionable validator output visible.
- If secret preflight fails, startup is blocked until env-only key material is available and fallback usage is resolved per policy.
- Operator actions on failure:
  1. Read each listed `[target]` error and fix the referenced field(s) in the matching config JSON.
  2. Re-run `python config/validate_config.py` until it prints the expected success string exactly.
  3. Re-launch `RoboDJ_Launcher.bat`.
- If startup is blocked because Python is missing, install Python 3 (or expose `py`/`python` on `PATH`) and rerun the launcher.
## Required Before Release Candidate

> Accountable signer for every gate item: **Release Manager**

- [ ] Config schema validation pass — Sign-off: Release Manager
- [ ] Backup/restore drill pass — Sign-off: Release Manager
- [ ] Crash recovery simulation pass — Sign-off: Release Manager
- [ ] Rollback path verified — Sign-off: Release Manager
- [ ] Accessibility QA matrix in `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` completed for shell, overlays, and scheduler interactions.
- [ ] Keyboard-only flow verified for all release-critical paths.
- [ ] Focus order and focus restoration behavior verified for overlays/modals.
- [ ] Screen-reader naming/instructions verified for controls, dialogs, timeline events, and state changes.
- [ ] WCAG AA color contrast verified across supported themes and interactive states.
- [ ] Reduced-motion behavior verified for key transitions and timeline interactions.
- [ ] Zoom/reflow at 200%+ verified with no clipped or blocked critical actions.
- [ ] **No Ship** enforced when custom widgets (drag/drop, tab strip, timeline blocks) lack keyboard and ARIA equivalents.
- [ ] Release blocked on any P0 accessibility failure; all P1 accessibility failures resolved before final approval.

## Checklist audit sign-off

- **Checklist owner:** ____________________
- **Sign-off (name + date/time):** ____________________

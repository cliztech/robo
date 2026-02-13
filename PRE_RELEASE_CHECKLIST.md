# Pre-release Checklist

## Baseline gates (run every release)

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive config backups in `config/backups/` for any risky config changes.

---

## v1.1 pass/fail gates

> Source roadmap section: [v1.1 — Reliability & Safety Baseline](FEATURE_HEAVY_ROADMAP_TODO.md#v11--reliability--safety-baseline)

### Must-item verification lines (all required)

- [ ] **Startup diagnostics panel (DB checks, key checks, audio device checks)**
  - **Command:** `./RoboDJ_Launcher.bat`
  - **Manual check (reproducible):** Open the startup diagnostics panel and capture status for all three checks.
  - **Pass criteria:** `database=PASS`, `key_integrity=PASS`, and `audio_device=PASS` are all visible before startup completes.
  - **Fail criteria:** Any check is `WARN`/`FAIL` or diagnostics panel does not render.

- [ ] **Config validator on launch for `schedules.json` and `prompt_variables.json`**
  - **Command (happy path):** `python config/validate_config.py`
  - **Command (negative test):**
    1. `cp config/schedules.json config/backups/schedules.pre_validation_gate.json`
    2. `printf '{"broken": true' > config/schedules.json`
    3. `python config/validate_config.py`
    4. `mv config/backups/schedules.pre_validation_gate.json config/schedules.json`
  - **Pass criteria:** Happy-path command prints the expected success message; negative test returns a validation error and blocks startup/save flow.
  - **Fail criteria:** Invalid JSON is accepted or launch/save proceeds without a validation block.

- [ ] **Crash-recovery flow with “restore last known good config”**
  - **Command sequence:**
    1. `cp config/schedules.json config/backups/schedules.lkg.test.json`
    2. Introduce a bad edit in `config/schedules.json` (for example, remove a closing brace).
    3. `./RoboDJ_Launcher.bat`
    4. Trigger recovery action: **Restore last known good config**.
    5. `python config/validate_config.py`
  - **Pass criteria:** Recovery completes and validation returns success within **120 seconds** from launcher start.
  - **Fail criteria:** Recovery takes longer than 120 seconds or restored config still fails validation.

- [ ] **One-click config backup snapshot (timestamped)**
  - **Command sequence:**
    1. `./RoboDJ_Launcher.bat`
    2. Trigger **One-click backup snapshot**.
    3. `ls -1 config/backups | tail -n 5`
  - **Pass criteria:** A new backup artifact appears in `config/backups/` with a timestamp in the name (`YYYYMMDD` or `YYYY-MM-DD`) and includes both schedule and prompt-variable config content.
  - **Fail criteria:** No new backup is created, name is not timestamped, or backup is incomplete.

### Exit-criteria gates

- [ ] **Recovery-time SLO gate**
  - **Measurement:** elapsed wall-clock time for crash-recovery test above.
  - **Pass criteria:** `t_recover <= 120s`.
  - **Fail criteria:** `t_recover > 120s`.

- [ ] **Validation-block gate**
  - **Measurement:** negative-test run in config-validator gate above.
  - **Pass criteria:** invalid config is blocked before runtime.
  - **Fail criteria:** runtime proceeds with invalid config.

---

## v1.2 pass/fail gates

> Source roadmap section: [v1.2 — Scheduling 2.0](FEATURE_HEAVY_ROADMAP_TODO.md#v12--scheduling-20)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - New weekly schedule setup time reduced by ~50%.
  - Conflicts surfaced before save/publish.

## v1.3 pass/fail gates

> Source roadmap section: [v1.3 — Prompt Intelligence & Content Quality](FEATURE_HEAVY_ROADMAP_TODO.md#v13--prompt-intelligence--content-quality)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Per-template rollback works without DB edits.
  - 100% variable substitutions previewable before run.

## v1.4 pass/fail gates

> Source roadmap section: [v1.4 — Audio Production Pipeline](FEATURE_HEAVY_ROADMAP_TODO.md#v14--audio-production-pipeline)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Default output meets target loudness profile.
  - Producer can audition composed segments before publish.

## v1.5 pass/fail gates

> Source roadmap section: [v1.5 — Library, Search, and Scale](FEATURE_HEAVY_ROADMAP_TODO.md#v15--library-search-and-scale)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Typical search response stays sub-second.
  - Duplicate issues detected before publish.

## v1.6 pass/fail gates

> Source roadmap section: [v1.6 — Integrations & Operations](FEATURE_HEAVY_ROADMAP_TODO.md#v16--integrations--operations)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - External triggers execute key automation paths reliably.
  - Actionable alerts arrive within minutes of failure.

## v2.0 pass/fail gates

> Source roadmap section: [v2.0 — Enterprise Readiness & Governance](FEATURE_HEAVY_ROADMAP_TODO.md#v20--enterprise-readiness--governance)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Access controls + attribution enforced end-to-end.
  - Full-day simulation catches schedule/content errors before air.

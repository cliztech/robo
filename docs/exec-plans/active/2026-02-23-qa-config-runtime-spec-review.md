# QA Report — Config Validation, Runtime Modules, and Spec Alignment

Date: 2026-02-23  
Scope order followed:
1) `config/` JSON + validation flow  
2) Core runtime modules in `backend/` tied to validation scope  
3) Spec/docs alignment (`docs/product-specs/`, `ARCHITECTURE.md`, `SKILLS.md`)

---

## Finding 1 — **major**
- **Path:** `CONFIG_VALIDATION.md`
- **Identifier:** `Required success output` (release gate text)

**Expected behavior:**
The documentation’s required success line should exactly match the actual validator success output so release/handoff gating is deterministic.

**Actual behavior:**
`CONFIG_VALIDATION.md` requires `Configuration validation passed for schedules.json and prompt_variables.json.` while `config/validate_config.py` prints `Configuration validation passed for: <all target json files>.` This mismatch can cause false gate failures during manual checks.

> **Implementation task stub:**
> - Update `CONFIG_VALIDATION.md` required success-output section to match the current script output format (including all validated targets), or update `config/validate_config.py` to emit the documented canonical line.
> - Keep one canonical string used by both docs and implementation to prevent drift.

---

## Finding 2 — **minor**
- **Path:** `config/validate_config.py`
- **Identifier:** `main()` / `--strict` argument handling

**Expected behavior:**
If `--strict` is exposed in CLI usage/help, strict-mode behavior should be implemented and observable (or the flag should be removed).

**Actual behavior:**
`--strict` is parsed but not used; runtime behavior is identical with or without the flag.

> **Implementation task stub:**
> - Either implement strict-mode semantics (for example: fail on unsupported/extra files, or stricter schema/version checks) and document them, or remove the flag and related usage text to avoid dead-option confusion.

---

## Finding 3 — **minor**
- **Path:** `config/validate_config.py`
- **Identifier:** `validate_target()` duplicate config/schema loads

**Expected behavior:**
`validate_target()` should perform a single, consistent load path per target to keep exception handling and performance straightforward.

**Actual behavior:**
For non-`schedules` targets, `config` and `schema` are loaded once before the `try` block and loaded again inside the `try` block. The first load is redundant and obscures intended error-handling structure.

> **Implementation task stub:**
> - Refactor `validate_target()` to load JSON exactly once per file inside one guarded path and keep error wrapping in one place.
> - Add/adjust tests for missing file and invalid JSON so future regressions are visible.

---

## Finding 4 — **major**
- **Path:** `ARCHITECTURE.md`
- **Identifier:** `Agent output contract` / repeated `Agent deliverables` sections

**Expected behavior:**
Top-level architecture doc should be clean, non-duplicative, and internally consistent so it can act as a reliable entry point.

**Actual behavior:**
`ARCHITECTURE.md` contains repeated headings/paragraph fragments, malformed markdown (`n##`), and duplicate deliverable lists, reducing clarity and making cross-team interpretation error-prone.

> **Implementation task stub:**
> - Normalize `ARCHITECTURE.md` into one canonical “Agent output/deliverables” section.
> - Remove duplicated blocks and malformed headings; run markdown lint/check as part of doc QA.

---

## Notes on reviewed files
- `docs/product-specs/index.md` and `docs/product-specs/new-user-onboarding.md` are concise and structurally consistent with a spec index + focused spec pattern.
- `backend/scheduling/scheduler_ui_service.py`, `backend/scheduling/schedule_conflict_detection.py`, and `backend/scheduling/scheduler_models.py` are aligned around conflict detection flow used by `config/validate_config.py`, with no blocker-level defect observed in this pass.

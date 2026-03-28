# RoboDJ Artifact Inventory

This document defines the canonical artifacts required to maintain the RoboDJ project's health, security, and readiness.

## 1. Strategic Planning Artifacts

These artifacts define the goal and current state of the project.

- **`TODO.md`**: High-level execution roadmap.
- **`docs/readiness_scorecard.md`**: Weighted readiness metrics (Target 80%+).
- **`docs/exec-plans/active/sprint-status.yaml`**: Canonical state for epic/story completion.

## 2. Technical Contracts

- **`docs/architecture/event-schema.json`**: Defined data structures for inter-module communication.
- **`config/validate_config.py`**: The logic defining valid runtime states.

## 3. Build & Evidence Artifacts [NEW]

To improve project visibility, every build/validation run should capture evidence:

- **`artifacts/build/frontend-build.log`**: Output of `npm run build`.
- **`artifacts/validation/backend-check.log`**: Output of `make check`.
- **`artifacts/validation/config-safety.log`**: Output of `python config/validate_config.py`.
- **`artifacts/security/reports/`**: Results from `make secret-scan` and security smoke tests.

## 4. Lifecycle Management

- **Planning**: Update `sprint-status.yaml` and `TODO.md` to reflect new goals.
- **Execution**: Run `make build` and capture logs.
- **Verification**: Refresh `readiness_scorecard.md` based on build/test results.

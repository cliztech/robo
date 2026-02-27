# TODO Tracked Issues — P0 Foundations + P1 Security & Compliance

This index tracks all currently unchecked items from `TODO.md` under:
- `P0 — Foundations`
- `P1 — Security & Compliance`

## Issue Index

| ID | Title | Owner Role | Effort | Issue File |
| --- | --- | --- | --- | --- |
| TI-001 | Create tracked issues for all Track A/B/C/D tasks from `PRODUCT_READINESS_PLAN.md` | Project Coordinator | M | [`TI-001.md`](tracked-issues/TI-001.md) |
| TI-002 | Add role-aware settings visibility model (`admin`, `operator`, `viewer`) | Security Engineer | M | [`TI-002.md`](tracked-issues/TI-002.md) |
| TI-003 | Implement idle timeout + re-auth requirements for sensitive actions | Runtime Engineer | M | [`TI-003.md`](tracked-issues/TI-003.md) |
| TI-004 | Implement key-rotation workflow CLI + operator checklist integration | Security Engineer | L | [`TI-004.md`](tracked-issues/TI-004.md) |
| TI-005 | Add redaction policy contract tests for logs/API responses | QA Engineer | M | [`TI-005.md`](tracked-issues/TI-005.md) |
| TI-006 | Add a pre-release security gate in release documentation | Release Manager | S | [`TI-006.md`](tracked-issues/TI-006.md) |
| TI-039 | Task A1.3 — Add per-action approval workflows and immutable audit trail export | Security Architect | L | [`TI-039.md`](tracked-issues/TI-039.md) |
| TI-040 | Task A2.2 — Add config-at-rest encryption for high-risk fields in JSON configs | Security Engineer | L | [`TI-040.md`](tracked-issues/TI-040.md) |
| TI-041 | Task A3.1 — Add security smoke script (authN/authZ checks, lockout checks) | QA Engineer | M | [`TI-041.md`](tracked-issues/TI-041.md) |


## v1.2 Scheduler UI Issue Index

| ID | Title | Owner Role | Effort | Status | Issue File |
| --- | --- | --- | --- | --- | --- |
| TI-039 | v1.2 UI: drag/drop weekly timeline on normalized schedule contracts | UI Engineer | L | In Progress | [`TI-039.md`](tracked-issues/TI-039.md) |
| TI-040 | v1.2 UI: inline conflict rendering and resolution actions | UI Engineer | M | Open | [`TI-040.md`](tracked-issues/TI-040.md) |
| TI-041 | v1.2 UI: keyboard parity for timeline edit and conflict resolution | Accessibility Engineer | M | Open | [`TI-041.md`](tracked-issues/TI-041.md) |

## Coverage check (Track A/B/C/D indexing)

Requirement: each `PRODUCT_READINESS_PLAN.md` Track A/B/C/D task is indexed by exactly one tracked issue.

### Track A mapping (8 tasks)

| Track Task | Tracked Issue |
| --- | --- |
| A1.1 | TI-002 |
| A1.2 | TI-003 |
| A1.3 | TI-007 |
| A2.1 | TI-004 |
| A2.2 | TI-008 |
| A2.3 | TI-005 |
| A3.1 | TI-009 |
| A3.2 | TI-006 |

### Track B mapping (8 tasks)

| Track Task | Tracked Issue |
| --- | --- |
| B1.1 | TI-010 |
| B1.2 | TI-011 |
| B1.3 | TI-012 |
| B2.1 | TI-013 |
| B2.2 | TI-014 |
| B2.3 | TI-015 |
| B3.1 | TI-016 |
| B3.2 | TI-017 |

### Track C mapping (9 tasks)

| Track Task | Tracked Issue |
| --- | --- |
| C1.1 | TI-018 |
| C1.2 | TI-019 |
| C1.3 | TI-020 |
| C2.1 | TI-021 |
| C2.2 | TI-022 |
| C2.3 | TI-023 |
| C3.1 | TI-024 |
| C3.2 | TI-025 |
| C3.3 | TI-026 |

### Track D mapping (8 tasks)

| Track Task | Tracked Issue |
| --- | --- |
| D1.1 | TI-027 |
| D1.2 | TI-028 |
| D1.3 | TI-029 |
| D2.1 | TI-030 |
| D2.2 | TI-031 |
| D2.3 | TI-032 |
| D3.1 | TI-033 |
| D3.2 | TI-034 |

### Coverage result

- Track A: 8/8 tasks mapped once.
- Track B: 8/8 tasks mapped once.
- Track C: 9/9 tasks mapped once.
- Track D: 8/8 tasks mapped once.
- Total: 33/33 tasks mapped one-to-one (`TI-002`…`TI-034`), with no duplicates and no gaps.

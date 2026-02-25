# Runbook Index

## Critical Failures

- `RB-001` Stream down or reconnect loop: check transport, encoder, and network path.
- `RB-002` Scheduler conflict publish blocked: run preflight validation and resolve conflicts.
- `RB-003` Prompt generation safety block: inspect guardrail failure and apply approved override path.

## Console and UX Failures

- `RB-010` Deck transport unresponsive: validate audio output device and restart playback engine.
- `RB-011` Browser filter latency spike: clear cache and reduce active filter complexity.
- `RB-012` Keyboard workflow not responding: verify focus scope and shortcut map.

## Security and Compliance

- `RB-020` Secret exposure suspicion: rotate affected keys and execute incident checklist.
- `RB-021` Redaction regression: run denylist contract tests and block release until green.
- `RB-022` Unauthorized settings action: audit role mapping and review session logs.
- `RB-023` CodeQL high/critical alert gate failure: follow security triage and dismissal policy.

## Data and Recovery

- `RB-030` Corrupted config load: restore latest known good snapshot.
- `RB-031` Failed migration: rollback schema migration and re-run validation.
- `RB-032` Crash recovery SLA breach: capture timing evidence and open blocker issue.

## Ownership and Escalation

- Primary owner: Project Coordinator.
- Technical owner: DevOps + QA shared triage.
- Security owner: SecOps for all `RB-02x` cases.

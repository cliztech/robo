# Continuous Improvement Loop

This runbook defines the standing feedback loop for agent-system quality, intervention policy, and capability evolution.

## 1) Leading indicators

Track these indicators on a rolling 30-day window and evaluate monthly during the Agent Capability Review:

| Indicator | Definition | Formula | Owner |
| --- | --- | --- | --- |
| Regression recurrence rate | Share of closed defects that recur within 30 days. | `reopened_regressions_30d / total_closed_regressions_30d` | QA Team (Regression Watcher) |
| Review rejection rate | Share of proposed changes rejected in Brutal Review / verifier gate. | `rejected_prs_or_packets_30d / reviewed_prs_or_packets_30d` | Brutal Review Team + Verifier |
| Incident MTTR | Mean time to recovery for production incidents. | `sum(incident_resolve_minutes) / incident_count` | DevOps + Incident Response |
| Handoff failure rate | Share of handoffs requiring replan due to missing/invalid evidence. | `handoffs_rejected_or_replanned_30d / total_handoffs_30d` | Planner + Handoff Agents |

## 2) Threshold → intervention matrix

When any threshold is breached for **2 consecutive measurement periods** (weekly samples in the month), intervention is mandatory.

| Indicator | Warning threshold | Breach threshold | Required intervention |
| --- | --- | --- | --- |
| Regression recurrence rate | `>= 8%` | `>= 12%` | Add targeted checklist/tooling guardrail (tests, lint/check, or regression detector). If still breaching next month, create a new specialist subagent for highest-frequency defect class. |
| Review rejection rate | `>= 15%` | `>= 22%` | Retrain prompt/persona guidance for the responsible team and add stricter pre-submit checklist. If still breaching next month, add a dedicated reviewer subagent for that scope. |
| Incident MTTR | `> 45 min` | `> 75 min` | Add incident triage checklist/tool automation first; then create on-call incident coordinator subagent if MTTR breach persists. |
| Handoff failure rate | `>= 10%` | `>= 18%` | Add/refresh handoff contract checklist and packet validator tool. If persistent, retrain planner/handoff persona prompts and split overloaded roles into a new handoff QA subagent. |

### Allowed intervention types

1. **Create new subagent** (team-scoped, explicit packet schema + acceptance criteria).
2. **Retrain prompt/persona** (update prompt contracts, role defaults, and failure examples).
3. **Add skill/checklist/tool** (new `SKILLS.md` entry, checklist update, or automated verifier command).

## 3) Execution hook (mandatory runbook action)

At breach threshold, runbook owners must open a same-sprint capability remediation task with one of these concrete repository updates:

- `_bmad/*agents*` (agent charter/workflow/policy updates for new or adjusted subagents), and/or
- `SKILLS.md` (new or revised skill/checklist/tool contract).

No breach may close as "monitor only" without at least one committed capability update in `_bmad/*agents*` or `SKILLS.md`.

## 4) Monthly Agent Capability Review cadence

- Review date: first business week of each month.
- Inputs: scorecard history + prior month incident/review/handoff metrics.
- Output artifact: monthly review entry under `.agent/verification/` using the template in `docs/operations/artifacts.md`.

## 5) Historical scorecard path

Persistent history is stored in:

- `docs/metrics/agent_capability_scorecard.md`

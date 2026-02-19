# Reliability SLOs, Alert Thresholds, and Incident Runbook

**Version:** 1.0
**Owners:** QA (verification), DevOps (operations), Management (escalation)

## Service-level objectives (SLOs)

| Domain | SLI | Target |
| --- | --- | --- |
| Schedule execution | Successful scheduled runs / total scheduled runs | >= 99.5% per 30-day window |
| Decision latency | p95 agent decision latency | <= 2.0s per 24-hour window |
| Recovery time | Time from failure detection to service restored | <= 120s p95 |
| Autonomy throughput | Completed autonomous actions / attempted actions | >= 98.0% per 7-day window |

## Alert thresholds

| Severity | Trigger | Initial response SLA | Escalation timer |
| --- | --- | --- | --- |
| P1 Critical | SLO breach with live operator impact | 5 minutes | 10 minutes to Incident Response lead |
| P2 High | Repeated failure trend, no immediate outage | 15 minutes | 30 minutes to team lead |
| P3 Medium | Single non-critical degraded signal | 1 business day | Next daily ops review |

## Escalation path

1. On-call operator validates alert signal and records timestamp.
2. QA confirms reproducibility and impact scope.
3. DevOps executes mitigation or rollback.
4. Management team is notified for P1/P2 incidents.
5. Postmortem owner assigned before incident closure.

## Incident runbook (first response)

1. **Acknowledge alert** and classify severity (P1/P2/P3).
2. **Stabilize service** using safe-mode or rollback path.
3. **Verify config state** using:
   - `python config/validate_config.py`
4. **Capture evidence** (logs, timestamp, impacted modules, attempted recovery actions).
5. **Communicate status** to stakeholders every 15 minutes for P1.
6. **Close incident** only after recovery verification and documented follow-up owner.

## Postmortem template

### 1) Incident summary
- Incident ID:
- Start/end time (UTC):
- Severity:
- Customer/operator impact:

### 2) Timeline
- Detection:
- Triage:
- Mitigation:
- Resolution:

### 3) Root cause
- Primary cause:
- Contributing factors:

### 4) Corrective actions
| Action | Owner | Due date | Status |
| --- | --- | --- | --- |
|  |  |  |  |

### 5) Prevention checks
- [ ] Runbook updates completed.
- [ ] Alert thresholds recalibrated if needed.
- [ ] Related roadmap/TODO items updated.

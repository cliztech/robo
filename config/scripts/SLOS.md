# RoboDJ SLOs

## Scope
These objectives cover playout continuity and the decision engine that selects each on-air element.

## SLI Definitions

### 1. Uptime SLI
- **Definition**: Percentage of scheduled playout minutes with no dead-air event.
- **Signal**:
  - Numerator: scheduled playout minutes where `dead_air` count = 0.
  - Denominator: total scheduled playout minutes.
- **Data sources**:
  - `system_events` (`event_type = 'dead_air'`)
  - scheduler/clock source for expected minutes.

### 2. Decision Latency SLI
- **Definition**: Time from decision request start to persisted selected rule path for a slot.
- **Signal**:
  - P95 and P99 of `playout_decisions.decision_latency_ms`.

## SLO Targets

### Uptime
- **Target**: 99.95% monthly playout minute uptime.
- **Error budget**: 0.05% unavailable minutes per month.
- **Suggested alerts**:
  - Warning when projected month-end uptime < 99.97%
  - Critical when projected month-end uptime < 99.95%

### Decision Latency
- **Target**: P95 < 800 ms and P99 < 1500 ms (rolling 30 days).
- **Error budget**:
  - <5% of decisions may exceed 800 ms
  - <1% may exceed 1500 ms
- **Suggested alerts**:
  - Warning when rolling 1-hour P95 > 800 ms
  - Critical when rolling 1-hour P99 > 1500 ms

## Supporting Reliability Metrics (non-SLO)
- Fallback rate (`playout_decisions.fallback_used / total decisions`)
- Script rejection rate (`script_outcomes.status = 'rejected' / total scripts`)
- Average transition quality score (`AVG(transition_scores.quality_score)`)
- Repetition score per daypart (`repetition_score_daily` view)

## Operational Review Cadence
- **Daily**: Review dashboard + dead-air incidents + fallback spikes.
- **Weekly**: Review repetition/daypart trends and script rejection reasons.
- **Monthly**: SLO attainment and error-budget burn-down.

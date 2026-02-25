# TI-002 Implementation Plan — Role-Aware Settings Visibility Model

## Scope

Define a production-ready visibility and editability matrix for settings surfaces across three roles:

- `admin`
- `operator`
- `viewer`

This plan covers only policy, enforcement points, and validation scenarios. It does not implement backend/frontend code paths.

## Settings Access Matrix

| Settings Surface | Example Data | `admin` | `operator` | `viewer` | Notes |
| --- | --- | --- | --- | --- | --- |
| Credentials & API secrets | provider keys, auth tokens | View masked + Edit + Rotate | No access | No access | High risk, admin-only lifecycle |
| Autonomy policy | automation levels, intervention thresholds | View + Edit | View only | View only | Operators need read visibility for run-time context |
| Scheduler defaults | templates, conflict policy, blackout windows | View + Edit | View + Edit | View only | Core execution surface for operator workflows |
| Prompt templates | system prompt variants, style policy | View + Edit | View + Edit (non-security fields) | View only | Security-sensitive prompt controls remain admin-only |
| Runtime toggles | safe mode, dry-run mode, feature gates | View + Edit | View + Edit (non-destructive toggles) | View only | Dangerous toggles require confirmation + audit |
| Audit/export settings | retention windows, export targets | View + Edit | View (summary only) | No access | Compliance boundary |
| Release/update channel | stable/beta channel, rollout controls | View + Edit | View only | View only | Prevent accidental rollout changes |
| Notification routing | alert channels, escalation contacts | View + Edit | View + Edit | View only | Operational ownership shared admin/operator |

## Enforcement Points

1. **Backend authorization gate**
   - Enforce role checks at each config mutation endpoint before write execution.
   - Return deterministic deny responses (`403`) with reason codes (`role_denied`, `field_denied`).

2. **Backend field-level serializer**
   - Redact or omit restricted fields in read responses based on caller role.
   - Default deny for newly introduced settings until explicitly mapped.

3. **Frontend settings surface gating**
   - Hide inaccessible sections for `viewer`.
   - Render read-only controls for view-only fields with explicit lock state.
   - Disable edit actions when backend indicates `can_edit=false`.

4. **Audit logging path**
   - Record allow/deny decisions with actor role, target setting key, and action (`read`, `write`).
   - Enforce immutable audit entries for all denied write attempts.

## Policy Rules

- **Default deny:** Unmapped setting keys are not visible/editable to non-admin roles.
- **Least privilege:** `viewer` never modifies state; `operator` only modifies operational settings.
- **Two-step guardrails:** high-impact changes (autonomy, release channel, credential lifecycle) require admin role + confirmation prompt.
- **Consistency:** frontend role hints must never be considered authoritative; backend policy is the source of truth.

## Validation Cases (Allow/Deny)

| ID | Role | Action | Surface | Expected Result |
| --- | --- | --- | --- | --- |
| RV-01 | admin | write | credentials | Allowed |
| RV-02 | operator | write | credentials | Denied (`403 role_denied`) |
| RV-03 | viewer | read | scheduler defaults | Allowed (read-only payload) |
| RV-04 | viewer | write | scheduler defaults | Denied (`403 role_denied`) |
| RV-05 | operator | write | scheduler defaults | Allowed |
| RV-06 | operator | write | release/update channel | Denied (`403 field_denied`) |
| RV-07 | admin | write | release/update channel | Allowed |
| RV-08 | viewer | read | audit/export settings | Denied/omitted from payload |
| RV-09 | operator | write | notification routing | Allowed |
| RV-10 | operator | write | unmapped new setting key | Denied (default deny) |

## Exit Criteria

- Access matrix is reviewed and accepted by Security + Runtime owners.
- All settings APIs have role + field-level policy mappings.
- Validation scenarios RV-01..RV-10 are represented in automated tests.

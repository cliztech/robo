# Telemetry Ethics and Opt-In Policy

## Principles

- Purpose limitation: collect only operational telemetry needed for reliability and safety.
- Data minimization: avoid personal data unless explicitly required.
- Transparency: clearly disclose what is collected and why.
- Operator control: telemetry can be enabled or disabled per environment profile.

## Opt-In Model

- Default mode: telemetry disabled for new installs.
- Explicit opt-in required by admin role.
- Consent record includes timestamp, actor, and policy version.

## Allowed Data Categories

- System health metrics (CPU, memory, startup time).
- Workflow event counters (validation pass/fail, publish attempts).
- Error signatures without secrets or raw prompt payloads.

## Prohibited Data

- API keys, secret material, auth tokens.
- Raw personally identifiable listener data.
- Full unredacted prompt or schedule payloads when policy forbids.

## Retention and Deletion

- Default retention: 30 days rolling.
- Secure purge on policy disable or explicit admin request.
- Export includes only policy-allowed fields.

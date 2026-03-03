# Product Packaging Tiers & Feature Gates

## Overview
This document defines the commercial packaging boundaries for RoboDJ, separating features into **Base** and **Pro** tiers. It also establishes the feature gating criteria and upgrade path expectations.

## Tier Definitions

### Base Tier
The Base Tier provides all essential functionality required for a single-station, partially-automated broadcast environment.
- **Target Audience:** Hobbyists, community radio, small single-stream broadcasters.
- **Core Capabilities:**
  - Standard timeline scheduler and conflict detection.
  - Baseline persona archetypes (Anchor, Entertainer).
  - Autonomy levels up to "Manual Assist" and "Segment-bounded Autonomy" (Level 1 & 2).
  - Basic local metrics and event logging.
  - Standard security (local RBAC for admin/viewer).
  - Community-driven support SLA.

### Pro Tier
The Pro Tier is designed for multi-tenant, high-reliability, fully-automated commercial environments.
- **Target Audience:** Commercial stations, syndicators, multi-channel networks.
- **Gated Capabilities:**
  - Multi-station/tenant management from a single control plane.
  - Custom persona development and style tuning.
  - Advanced autonomy levels: "Oversight Autonomy" and "Lights-Out Overnight" (Level 3 & 4).
  - Immutable audit trails, external export integrations.
  - Human-in-the-loop (HITL) checkpoints and custom workflow routing.
  - Advanced Security: Key rotation workflows, session timeouts, SAML/SSO integration.
  - Priority support SLA (Guaranteed response times, dedicated runbooks).

## Feature Gating Criteria
Features are assigned to the Pro tier if they meet any of the following criteria:
1. **Multi-tenancy:** The feature manages resources across more than one distinct station or brand.
2. **High-Risk Automation:** The feature allows the system to take irreversible actions without immediate human oversight (Autonomy L3+).
3. **Enterprise Compliance:** The feature generates immutable logs, enforces advanced data redaction, or integrates with enterprise identity providers.
4. **Custom Analytics:** Advanced telemetry, custom dashboarding, or direct database access.

## Upgrade Path Expectations
- **Config Portability:** Upgrading from Base to Pro must be a seamless, config-compatible transition. `schedules.json` and `prompt_variables.json` schemas are backwards-compatible across tiers.
- **Trial Periods:** Pro features may be toggled via license key validation within the application, allowing for 14-day evaluation periods without data migration.
- **Downgrade Safety:** Downgrading to Base will lock access to Pro UI surfaces and gracefully pause any Level 3+ autonomy policies, reverting to Level 2.

## Alignment with Policies
- See `docs/support/support_triage_sla.md` for tier-specific SLA targets.
- See `config/env_contract.json` for environment flags required by advanced security features.
# Studio Artifact Orchestrator Protocol

## Vision

The Artifact Orchestrator ensures that the DGN-DJ Studio remains documented, observable, and verifiable. It shifts from reactive documentation to proactive "Agency," where artifacts are planned as part of the technical lifecycle.

## Artifact Taxonomy

### 1. Vision & Identity (The "Why")

- **Vision Documents**: `VISION_STUDIO.md`, `BRAND_GUIDELINES.md`
- **Goal Alignment**: `GOALS_Q2_2024.md` (Planned)

### 2. Architecture & Design (The "What")

- **System Maps**: `STUDIO_CORE_ENGINE.md`, `STUDIO_API_MAP.md` (Planned)
- **Data Models**: `SCHEMA_STUDIO.md`
- **Security Polices**: `SECURITY_HARDENING_REPORT.md` (Planned)

### 3. Operations & Lifecycle (The "How")

- **Manuals**: `STUDIO_OPERATIONS_MANUAL.md`
- **Onboarding**: `AGENT_ONBOARDING.md` (Planned)
- **Maintenance**: `MAINTENANCE_LOG.ndjson`

## Orchestration Loop

### Phase A: Observation (Audit)

The agent scans the codebase for:

- New API routes without documentation.
- New security policies without impact analysis.
- Build logs without summary artifacts.
- New dependencies without licensing checks.

### Phase B: Planning (Foresee)

The agent proposes a list of artifacts based on the gaps found.

- _Example_: "I see a new `ApprovalRecord` structure. I should generate a `SECURITY_HARDENING_REPORT.md` to document this hardening."

### Phase C: Execution (Build)

The agent generates the artifacts using specialized templates.

### Phase D: Verification (Seal)

The agent validates the artifacts against the **Studio Brand Guidelines**.

## "Useful Artifact" Criteria

An artifact is only "Useful" if it fulfills at least one:

- **Reduces Agent Confusion**: Clarifies a complex logic for future agents.
- **Provides Evidence**: Proves a test/build result for the user.
- **Formalizes Protocol**: Establishes a rule that must be followed.
- **Improves Aesthetics**: Enhances the professional look and feel of the project repo.

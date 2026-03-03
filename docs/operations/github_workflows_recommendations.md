# GitHub Workflow Additions (Recommended)

This repo already has strong baseline CI/CD (`ci.yml`, `release-readiness-gate.yml`, `codeql.yml`, release, docker, and config validation). The highest-leverage additions are workflows that reduce supply-chain risk, keep automation healthy, and speed triage.

## Priority 1 (add first)

1. **Dependency Review Gate**
   - **Why:** Blocks risky dependency updates in pull requests before merge.
   - **Trigger:** `pull_request`.
   - **Action:** `actions/dependency-review-action`.
   - **Outcome:** Prevents accidental introduction of high/Critical CVEs and suspicious licenses.

2. **Actionlint + Workflow Policy Validation**
   - **Why:** Catches broken or unsafe workflow syntax before it lands.
   - **Trigger:** PRs touching `.github/workflows/**`.
   - **Tools:** `rhysd/actionlint` + custom policy checks (pin SHAs, least permissions).
   - **Outcome:** Hardens the CI control plane and prevents pipeline regressions.

3. **OpenSSF Scorecard (Security Posture Monitor)**
   - **Why:** Continuous security posture scoring for branch protection, token permissions, dependency update hygiene, etc.
   - **Trigger:** weekly schedule + manual dispatch.
   - **Action:** `ossf/scorecard-action`.
   - **Outcome:** Objective risk trendline and auditable security baseline.

## Priority 2 (operational efficiency)

4. **Stale Issue/PR Automation**
   - **Why:** Keeps backlog actionable and reduces reviewer load.
   - **Trigger:** daily schedule.
   - **Action:** `actions/stale` with conservative thresholds.
   - **Outcome:** Faster triage and better signal-to-noise.

5. **Auto-labeler for PR routing**
   - **Why:** Automatically labels `backend`, `docs`, `config`, `ui`, `security`, `ci` by changed paths.
   - **Trigger:** `pull_request_target` or `pull_request`.
   - **Action:** `actions/labeler`.
   - **Outcome:** Better team routing and SLA ownership across DevOps/SecOps/QA.

6. **Nightly Full Validation Matrix**
   - **Why:** Keep PR CI fast while still running exhaustive checks regularly.
   - **Trigger:** nightly schedule.
   - **Scope:** extended Node/Python matrix + long-running integration checks.
   - **Outcome:** Early detection of drift without slowing every PR.

## Priority 3 (optional but valuable)

7. **Dependabot Auto-triage Workflow**
   - **Why:** Groups and labels dependency PRs by risk and subsystem.
   - **Trigger:** `pull_request` from Dependabot.
   - **Outcome:** Faster patch cadence and lower cognitive overhead.

8. **Required Docs Drift Check**
   - **Why:** Enforces sync between runtime manifests and canonical docs (building on existing runtime validation).
   - **Trigger:** PRs affecting manifests/docs.
   - **Outcome:** Prevents architecture/documentation divergence.

## Suggested rollout order

1. Dependency Review
2. Actionlint + workflow policy checks
3. OSSF Scorecard
4. Stale + Auto-labeler
5. Nightly full validation

This sequence gives immediate security ROI first, then operational throughput improvements.

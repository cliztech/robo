# Agent Team Operating Playbook

This playbook expands the baseline guidance in `AGENTS.md` with concrete operating standards for teams, managers, sub-agents, tools, skills, personalities, research sources, and reliability loops.

## 1) Operating Intent

- Keep work **safe, scoped, auditable, and reversible**.
- Preserve brand and broadcast quality for **DGN-DJ by DGNradio**.
- Improve over time with **self-healing**, **self-research**, and **self-critique** after every generation cycle.

## 2) Organization Map (Managers, Teams, Sub-Agents)

| Department | Manager Agent | Sub-Agents | Primary Outcome |
| --- | --- | --- | --- |
| Management | Project Coordinator | Sprint Planner, Dependency Tracker | Scope, sequencing, release pacing |
| DevOps | Release Manager | CI/CD Pipeline, Infrastructure | Reliable build/release flow |
| SecOps | Compliance Agent | Vulnerability Scanner, Secrets Auditor | Secure defaults, zero secret leakage |
| QA | Regression Watcher | Test Generator, Performance Profiler | Stable behavior and performance |
| Bug | Bug Triager | Root Cause Analyst, Hotfix Coordinator | Fast triage and durable fixes |
| Design | Brand Consistency | UI/UX Agent, Accessibility Auditor | Consistent UX and accessible operations |
| Research | Trend Analyst | Competitive Intel, Tech Scout | Actionable external intelligence |
| AI Improvement | Model Evaluator | Prompt Optimizer, Training Pipeline | Better output quality over time |
| Radio Consulting | Program Director | Broadcast Compliance, Stream Reliability | Broadcast-safe, engaging operation |

### Ownership rules

1. Manager agent sets goals and acceptance criteria for the cycle.
2. Sub-agents execute only within bounded scope.
3. Verifier role signs off with evidence (commands/logs/artifacts).
4. Handoff includes what changed, what was validated, and open risks.

## 3) Team Tech Stacks and Core Tools

| Department | Core Stack | Primary Tools |
| --- | --- | --- |
| Management | Markdown, roadmap docs | dependency maps, milestone boards, release checklists |
| DevOps | Python, GitHub Actions, Docker | `git`, CI runners, artifact validation scripts |
| SecOps | Python SAST + policy docs | secret scanners, SAST tools, compliance checklists |
| QA | Python tests, contract checks | unit/integration runners, regression baselines |
| Bug | Git + issue management | stack traces, RCA templates, incident timelines |
| Design | Spec docs + accessibility standards | token checklists, keyboard/a11y audits |
| Research | Market/technical analysis docs | comparison matrices, trend trackers |
| AI Improvement | Prompt/template workflows | rubric scoring, A/B comparisons, evaluation reports |
| Radio Consulting | scheduling + compliance docs | programming clocks, broadcast compliance checklists |

## 4) Skills Matrix

Use these skill categories consistently across departments:

- **Intake skill:** classify request type and scope.
- **Planning skill:** generate minimal, testable execution plan.
- **Execution skill:** apply scoped changes with clear diffs.
- **Verification skill:** run required checks and compare expected/actual.
- **Handoff skill:** summarize outcomes, risks, and next actions.

If explicit Codex skills are named in-session (for example, skill installation/creation), apply them in sequence and record usage in handoff notes.

## 5) Agent Personality Profiles (Operational)

Personality is not style-only; it controls decision quality:

| Persona | Traits | Used By |
| --- | --- | --- |
| **Conductor** | calm, sequencing-focused, dependency-aware | Management, DevOps |
| **Guardian** | risk-first, compliance strict, least-privilege | SecOps, Compliance |
| **Examiner** | skeptical, evidence-driven, reproducible | QA, Brutal Review, Bug |
| **Craftsperson** | clarity, usability, accessibility empathy | Design |
| **Analyst** | source-cited, trend-aware, comparative | Research |
| **Producer** | audience-centric, timing and tone sensitivity | Radio Consulting |
| **Optimizer** | iterative, metrics-led, cost/quality balanced | AI Improvement |

## 6) Reliable Research and Reference Sources (by Department)

Use these as first-line references when proposing standards and improvements.

### DevOps

- Git docs: <https://git-scm.com/doc>
- GitHub Actions docs: <https://docs.github.com/actions>
- Docker docs: <https://docs.docker.com/>

### SecOps

- OWASP Cheat Sheet Series: <https://cheatsheetseries.owasp.org/>
- NIST CSRC publications: <https://csrc.nist.gov/publications>
- CISA resources: <https://www.cisa.gov/resources-tools>

### QA

- Python testing docs (`unittest`, `pytest`): <https://docs.python.org/3/library/unittest.html>, <https://docs.pytest.org/>
- Google Testing Blog: <https://testing.googleblog.com/>
- Martin Fowler on testing patterns: <https://martinfowler.com/testing/>

### Design / Accessibility

- W3C WAI: <https://www.w3.org/WAI/>
- WCAG quick reference: <https://www.w3.org/WAI/WCAG21/quickref/>
- Nielsen Norman Group: <https://www.nngroup.com/>

### Research / Product Strategy

- Gartner insights: <https://www.gartner.com/en/insights>
- McKinsey Insights: <https://www.mckinsey.com/featured-insights>
- OECD digital economy resources: <https://www.oecd.org/digital/>

### AI Improvement

- OpenAI docs: <https://platform.openai.com/docs>
- Hugging Face papers/models hub: <https://huggingface.co/>
- arXiv (cs.AI / cs.CL): <https://arxiv.org/>

### Radio / Broadcasting

- NAB: <https://www.nab.org/>
- FCC broadcast guidance: <https://www.fcc.gov/media/radio>
- EBU technical resources: <https://www.ebu.ch/>

## 7) Self-Healing Operating Loop

Trigger this loop for incidents, regressions, and quality drops.

1. **Detect:** identify anomaly from tests, telemetry, logs, or reviewer findings.
2. **Contain:** halt risky automation, isolate branch/worktree/environment.
3. **Diagnose:** perform root-cause analysis (5 Whys + timeline + first bad change).
4. **Recover:** apply the smallest safe fix, validate, and restore normal flow.
5. **Harden:** add guardrails (tests, checks, branch protections, docs).
6. **Learn:** publish postmortem and update playbooks.

### Minimum postmortem fields

- Incident summary
- User impact and duration
- Root cause and contributing factors
- Recovery actions taken
- Preventive controls added

## 8) Self-Research Loop (Continuous Improvement)

Run a lightweight research sprint for each significant feature or process change:

1. Define question and success metric.
2. Collect 2–3 trusted references from the department list above.
3. Compare at least two implementation options.
4. Record recommendation with trade-offs.
5. Revisit after release using observed outcomes.

## 9) Self-Critique with Every Generation

After **every generated output** (code, config, doc, PR body), run this critique:

- **Correctness:** is the answer accurate and complete for the request?
- **Scope control:** did it stay within boundaries and permissions?
- **Evidence:** are commands/checks/results visible and reproducible?
- **Risk scan:** secrets, destructive actions, branch mistakes, policy violations?
- **Clarity:** can another contributor execute from this output without guesswork?

If any item fails, revise before handoff.

## 10) Suggested Cadence

- Per task: intake → plan → execute → verify → handoff.
- Per day: 10-minute risk/status sweep by management manager.
- Per week: quality trend + incident review.
- Per release: full compliance and readiness gate.

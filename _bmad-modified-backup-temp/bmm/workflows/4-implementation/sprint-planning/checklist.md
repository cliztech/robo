# Sprint Planning Validation Checklist

## Pre-Planning Freshness Gate (Required)

- [ ] Reviewed every source-of-truth status section listed in `docs/operations/execution_index.md`
- [ ] Confirmed each SoT section includes a weekly update entry with `Date (UTC)` in the last 7 days
- [ ] If any stale SoT entries were found, sprint planning was blocked and owners were asked to refresh
- [ ] Verified stale SoT entries were refreshed before continuing sprint-planning
- [ ] Captured stale-check results in planning notes using the runbook: `docs/operations/runbooks/sprint_planning_source_of_truth_gate.md`

## Core Validation

### Complete Coverage Check

- [ ] Every epic found in epic\*.md files appears in sprint-status.yaml
- [ ] Every story found in epic\*.md files appears in sprint-status.yaml
- [ ] Every epic has a corresponding retrospective entry
- [ ] No items in sprint-status.yaml that don't exist in epic files

### Parsing Verification

Compare epic files against generated sprint-status.yaml:

```
Epic Files Contains:                Sprint Status Contains:
✓ Epic 1                            ✓ epic-1: [status]
  ✓ Story 1.1: User Auth              ✓ 1-1-user-auth: [status]
  ✓ Story 1.2: Account Mgmt           ✓ 1-2-account-mgmt: [status]
  ✓ Story 1.3: Plant Naming           ✓ 1-3-plant-naming: [status]
                                      ✓ epic-1-retrospective: [status]
✓ Epic 2                            ✓ epic-2: [status]
  ✓ Story 2.1: Personality Model      ✓ 2-1-personality-model: [status]
  ✓ Story 2.2: Chat Interface         ✓ 2-2-chat-interface: [status]
                                      ✓ epic-2-retrospective: [status]
```

### Final Check

- [ ] Total count of epics matches
- [ ] Total count of stories matches
- [ ] All items are in the expected order (epic, stories, retrospective)

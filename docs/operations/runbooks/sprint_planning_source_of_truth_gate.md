# Sprint Planning Source-of-Truth Freshness Gate Runbook

## Purpose

This runbook defines the required preflight gate that must pass **before** running `sprint-planning`.

The gate validates that every source-of-truth (SoT) status section listed in `docs/operations/execution_index.md` has been refreshed within the last 7 days.

## Blocking rule

- If any SoT status section is older than 7 days, sprint planning is **blocked**.
- The listed owner must refresh stale status entries first.
- `sprint-planning` may resume only when all SoT status sections are fresh.

## Inputs

- `docs/operations/execution_index.md`
- The SoT files/sections linked in the **Source of truth** column
- Current UTC date

## Procedure

1. Open `docs/operations/execution_index.md` and copy all SoT links from the active tracks table.
2. For each SoT link, open the exact target section.
3. Find the newest weekly update entry following the update template:
   - `- Date (UTC): YYYY-MM-DD`
4. Calculate age in whole days using current UTC date.
5. Mark each SoT target:
   - `fresh` if age ≤ 7 days
   - `stale` if age > 7 days or no valid date entry exists
6. If any entry is stale, stop and send a refresh request to the listed owner.
7. After owners refresh stale entries, rerun this gate.
8. Start `sprint-planning` only after all entries are `fresh`.

## Required blocking output template

```md
## Sprint Planning Gate Result: BLOCKED

- Gate: Source-of-truth freshness (7-day limit)
- Checked at (UTC): 2026-02-17

### Stale entries
- Track: <track name>
  - Owner: <owner>
  - SoT: <file + section link>
  - Last update (UTC): <date or missing>
  - Age: <N days>
  - Action: Owner refresh required before sprint-planning

### Decision
Sprint planning is blocked until all stale SoT entries are refreshed.
```

## Required pass output template

```md
## Sprint Planning Gate Result: PASS

- Gate: Source-of-truth freshness (7-day limit)
- Checked at (UTC): 2026-02-17
- Result: All SoT status sections refreshed within 7 days

Sprint planning may proceed.
```

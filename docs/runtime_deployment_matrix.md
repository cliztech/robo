# Runtime & Deployment Matrix

**Version:** 1.0
**Applies to:** `dev`, `staging`, `prod`

## Supported profiles

| Profile | Primary runtime | Launch path | Data source | Intended usage |
| --- | --- | --- | --- | --- |
| `dev` | Python 3.x + local scripts | `python` / local tooling | Local config + local DB copies | Feature/dev validation |
| `staging` | Windows launcher + validated config | `RoboDJ_Launcher.bat` | Staging config snapshots | Pre-release verification |
| `prod` | Windows launcher + approved release bundle | `RoboDJ_Launcher.bat` | Production config snapshots | Live operations |

## Compatibility constraints

| Concern | `dev` | `staging` | `prod` |
| --- | --- | --- | --- |
| Config validation (`config/validate_config.py`) | Required before merge | Required before release candidate | Required before deployment |
| Backup snapshots (`config/backups/`) | Recommended | Required | Required |
| Secret handling (`.key`, env vars) | Placeholder or env-only | Env-only; no plaintext in repo | Env-only; audited |
| Database files (`settings.db`, `user_content.db`) | Read-only for agents | Read-only for agents | Read-only for agents |
| Binary edits (`.exe`) | Forbidden | Forbidden | Forbidden |

### Secret handling (`.key`, env vars)

#### Secret manager key -> runtime env var mapping

| Secret manager key (authoritative source) | Runtime env var (consumed by app) | Notes |
| --- | --- | --- |
| `dgn-dj/<profile>/ROBODJ_SECRET_KEY` | `ROBODJ_SECRET_KEY` | Primary symmetric secret; rotate as a pair with v2 key. |
| `dgn-dj/<profile>/ROBODJ_SECRET_V2_KEY` | `ROBODJ_SECRET_V2_KEY` | Secondary/forward-compat key; required in all profiles. |

#### Rotation ownership and approval by profile

| Profile | Rotation owner | Approval authority | Allowed fallback file usage |
| --- | --- | --- | --- |
| `dev` | Feature owner or local operator | Dev lead | Allowed only for explicit local development or break-glass testing; remove after use. |
| `staging` | Release Manager Agent | Management Team sign-off | Not allowed for normal flow; break-glass only with documented incident ticket + expiry. |
| `prod` | Release Manager Agent + SecOps Secrets Auditor Agent | Incident commander or designated production approver | Not allowed for normal flow; break-glass only during active incident with post-incident cleanup evidence. |

Normal release workflows must be env-only for secret injection. Fallback secret files are prohibited outside explicit local dev/break-glass scenarios.

## Promotion gates

### `dev` -> `staging`

- Config validation passes.
- Runtime secret preflight passes in env-only mode: `python config/check_runtime_secrets.py --require-env-only`.
- Roadmap-critical docs updated (contracts/runbooks/checklists).
- No secret exposure in staged diff.

### `staging` -> `prod`

- `PRE_RELEASE_CHECKLIST.md` gates completed.
- Runtime secret preflight passes in env-only mode: `python config/check_runtime_secrets.py --require-env-only`.
- Rollback drill validated against latest snapshot.
- Incident escalation contacts confirmed.

## Drift policy

If a profile deviates from this matrix, document the exception in release notes with:

- date/time,
- owner,
- expected duration,
- rollback/remediation path.

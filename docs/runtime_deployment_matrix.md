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

## Promotion gates

### `dev` -> `staging`

- Config validation passes.
- Roadmap-critical docs updated (contracts/runbooks/checklists).
- No secret exposure in staged diff.

### `staging` -> `prod`

- `PRE_RELEASE_CHECKLIST.md` gates completed.
- Rollback drill validated against latest snapshot.
- Incident escalation contacts confirmed.

## Drift policy

If a profile deviates from this matrix, document the exception in release notes with:

- date/time,
- owner,
- expected duration,
- rollback/remediation path.

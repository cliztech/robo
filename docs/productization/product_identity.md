# Product Identity Decision Record

## Status
Accepted

## Decision
The single approved product name is **DGN-DJ by DGNradio**.

### Allowed display forms
- **Primary (first mention):** `DGN-DJ by DGNradio`
- **Short form (subsequent mentions):** `DGN-DJ`

## Legacy aliases
The following legacy names are **not approved for new product-facing copy** and are retained only for migration, compatibility, or historical context:

- `RoboDJ`
- `AetherRadio`

## Compatibility and migration rules
- Keep legacy names only when referencing immutable runtime artifacts or historical records (for example: `RoboDJ Automation.exe`, `RoboDJ_Launcher.bat`, legacy docs, schema titles, or migration notes).
- New top-level messaging, architecture summaries, and operational instructions must use `DGN-DJ by DGNradio` / `DGN-DJ`.
- Any newly introduced legacy alias usage must be explicitly allowlisted in `scripts/check_product_naming.py` with a rationale.

## Enforcement scope
`python scripts/check_product_naming.py` is the canonical naming guard for repository docs and context files. It fails CI when forbidden aliases are found outside the migration allowlist.

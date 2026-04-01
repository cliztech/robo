# Maintenance Utilities

## `fix_escaped_quotes.py`
- **Purpose:** Normalize accidental escaped double quotes (`\"`) in UTF-8 text files.
- **Owner:** Platform Engineering.
- **Safe usage:** Dry-run by default. Use `--write` only against explicitly targeted source files.
- **Deprecation date:** 2026-12-31 (or sooner if integrated into lint/formatter tooling).

### Example
```bash
python scripts/maintenance/fix_escaped_quotes.py src/components/audio/DegenTransport.tsx
python scripts/maintenance/fix_escaped_quotes.py --write src/components/audio/DegenTransport.tsx
```

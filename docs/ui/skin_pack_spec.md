# Skin Pack Specification

## Purpose

Skin packs provide constrained visual customization for DGN-DJ without allowing script execution or remote code loading.

## Manifest contract

Each package must include `skin.manifest.json` and validate against `contracts/skin.manifest.schema.json`.

Required fields:

- `id`
- `name`
- `version`
- `author`
- `compatibility.min_app_version`
- `compatibility.max_app_version`
- `tokens` with these required token mappings:
  - `color_bg`
  - `color_surface`
  - `color_text`
  - `color_accent`
  - `color_deck_a`
  - `color_deck_b`
  - `radius_md`
  - `shadow_soft`

Optional fields:

- `description`
- `assets.fonts[]`
- `assets.background_textures[]`
- `assets.icons[]`

## Security sandbox rules

1. **No scripts**: manifests with `script` or `scripts` fields are rejected.
2. **Constrained sources**: asset paths must be local and match `skins/*` or `assets/*`; absolute URLs and traversal (`..`) are blocked.
3. **File size caps**:
   - manifest max: `256 KiB`
   - per-asset max: `5 MiB`

On validation failure, the runtime always falls back to `dgn.default.dark`.

## Example

```json
{
  "id": "acme.midnight.blue",
  "name": "Midnight Blue",
  "version": "1.2.0",
  "author": "Acme Audio",
  "compatibility": {
    "min_app_version": "1.0.0",
    "max_app_version": "2.0.0"
  },
  "tokens": {
    "color_bg": "224 28% 6%",
    "color_surface": "224 20% 10%",
    "color_text": "220 30% 96%",
    "color_accent": "197 100% 52%",
    "color_deck_a": "197 100% 52%",
    "color_deck_b": "265 90% 70%",
    "radius_md": "10px",
    "shadow_soft": "0 4px 14px hsl(220 40% 2% / 0.35)"
  },
  "assets": {
    "fonts": ["skins/midnight/fonts/inter.woff2"],
    "background_textures": ["skins/midnight/textures/noise.webp"],
    "icons": ["skins/midnight/icons/cue.svg"]
  }
}
```

## Migration rules

- **Rule 1**: Keep `id` stable forever; treat `version` as semver.
- **Rule 2**: If required tokens change in a future app release, increment manifest `version` and add missing token values before import.
- **Rule 3**: If compatibility windows change, only widen ranges after validating visual regressions across dashboard, studio, and schedule views.
- **Rule 4**: Remove unsupported asset extensions during migration (`gif`, `bmp`, executables, script files).
- **Rule 5**: If migration fails validation, the package remains installed but inactive; operator can preview default fallback.

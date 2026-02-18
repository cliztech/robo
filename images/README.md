# Image Asset Naming Policy

This directory stores curated visual and video references for DJ UI research.

## Naming convention

All **top-level** curated media files in `images/` must follow:

`vdj_<area>_<variant>_<resolution>.<ext>`

Rules:

- `vdj` is a fixed prefix for VirtualDJ-inspired research assets.
- `<area>` uses lowercase snake_case and describes feature/module context (for example: `broadcast`, `performancefx`, `mixermain`).
- `<variant>` uses `v1`, `v2`, etc. for alternate shots in the same area.
- `<resolution>` is either pixel dimensions (for still images, like `1920x1080`) or `source` when dimensions are not embedded/reliable (for videos).
- `<ext>` must be lowercase.

## Accepted formats

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`
- Video references: `.mp4`

## Duplicate policy

- Duplicate binaries are determined by SHA-256 hash.
- Only one canonical filename is kept for each unique hash.
- Near-duplicates (same subject but different binary data) may coexist using incremented `<variant>` values.

## QA validation

Run:

```bash
python config/scripts/validate_image_assets.py
```

The validator flags:

- Duplicate hashes
- Filenames that do not match the naming convention
- Unsupported file formats

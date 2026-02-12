# Contributing

## CI scope for this repository

This repository tracks a packaged RoboDJ distribution, not compilable application source code.

The CI workflow intentionally runs **distribution/config validation only**:

- JSON syntax validation for `config/*.json`
- Python syntax checks for maintenance scripts (for example `config/inspect_db.py`)
- Presence checks for expected distribution artifacts and config layout

## Do not add generic starter build workflows

Please do **not** add default C/C++, CMake, or MSBuild starter workflows unless this repository starts including the corresponding source/build assets.

If build assets are introduced later, add build workflows in a separate pull request with a short explanation of:

1. Which new source/build files were added.
2. Why the new workflow is now required.
3. How the workflow maps to this repository's structure.

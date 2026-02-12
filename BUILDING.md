# BUILDING

This repository is currently a packaged distribution, not a source build. The canonical entrypoint for repeatable setup and validation is the root `Makefile`.

## Toolchain versions

Use the following minimum toolchain in a clean-room environment:

- **OS**: Ubuntu 22.04+ (or equivalent Linux environment for repository validation)
- **GNU Make**: 4.3+
- **Python**: 3.10+
- **Git**: 2.34+

For Windows runtime artifact testing:

- **Windows**: 10/11
- **PowerShell**: 5.1+ or 7+

## Repository layout assumptions

- Application source area: `apps/dgn-dj-desktop/`
- Shared packages/utilities: `packages/`
- Infrastructure files: `infra/`
- Deployment artifacts: `dist/`

## Clean-room rebuild / verification process

1. Clone the repository into a fresh workspace.
2. Confirm you are on the expected branch and no local changes exist:

   ```bash
   git status --short
   ```

3. Bootstrap the environment:

   ```bash
   make bootstrap
   ```

4. Validate the expected project structure:

   ```bash
   make build
   make verify
   ```

5. Stage deployment artifacts under `dist/` and validate packaging assumptions:

   ```bash
   make package
   ```

## Notes

- Runtime databases (`*.db`) should be treated as deployment/runtime state and stored in `dist/` (or external release assets), not as source files.
- Binaries (for example `RoboDJ Automation.exe`) should be distributed from `dist/` or release attachments.

.PHONY: bootstrap build package verify

bootstrap:
	@echo "[bootstrap] verifying required tools"
	@python3 --version
	@git --version
	@echo "[bootstrap] repository scaffold is ready"

build:
	@echo "[build] no source compilation step exists for this distribution"
	@mkdir -p apps/dgn-dj-desktop packages infra/docker infra/mcp infra/lsp infra/scripts dist
	@echo "[build] directory structure verified"

package:
	@echo "[package] preparing dist directory"
	@mkdir -p dist
	@test -f dist/RoboDJ_Launcher.bat || (echo "Missing dist/RoboDJ_Launcher.bat" && exit 1)
	@echo "[package] deployment artifacts are staged under dist/"

verify:
	@echo "[verify] checking required repository layout"
	@test -d apps/dgn-dj-desktop
	@test -d packages
	@test -d infra/docker
	@test -d .github/workflows
	@test -f BUILDING.md
	@test -f infra/docker/docker-compose.yaml
	@test -f infra/scripts/pyinstxtractor.py
	@test -f dist/RoboDJ_Launcher.bat
	@echo "[verify] layout checks passed"

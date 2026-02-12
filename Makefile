.PHONY: build qa smoke

build:
	@test -f "RoboDJ_Launcher.bat"
	@mkdir -p .artifacts
	@tar -czf .artifacts/robodj-config.tgz config/*.json config/*.signal config/*.lock
	@echo "Build complete: .artifacts/robodj-config.tgz"

qa:
	yamllint docker-compose.yaml
	markdownlint-cli2 "**/*.md" "!make-4.3/**"
	python -m py_compile config/inspect_db.py

smoke:
	@echo "Smoke target: validating runtime artifacts"
	@test -f "RoboDJ_Launcher.bat"
	@echo "Smoke check complete"

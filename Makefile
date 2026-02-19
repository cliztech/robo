.PHONY: help build build-all build-modules build-airwaves build-robo-rippa package-config qa smoke run-airwaves run-robo-rippa check distcheck
.PHONY: help build build-all build-modules package-config qa smoke run-airwaves run-robo-rippa check distcheck

PYTHON ?= python3
ARTIFACT_DIR ?= .artifacts
CONFIG_ARCHIVE ?= $(ARTIFACT_DIR)/robodj-config.tgz

help:
	@echo "Targets:"
	@echo "  build / build-all / build-modules  Build all modules and package config artifact"
	@echo "  build-airwaves                    Build dgn-airwaves only"
	@echo "  build-robo-rippa                  Build dgn-robo-rippa only"
	@echo "  qa                                Run lint and basic Python checks"
	@echo "  smoke                             Validate required runtime files exist"
	@echo "  run-airwaves                      Run dgn-airwaves stub"
	@echo "  run-robo-rippa                    Run dgn-robo-rippa stub"
	@echo "  check                             Run all validation checks"
	@echo "  distcheck                         Alias of check for CI compatibility"

build: build-modules package-config
build-all: build

build-modules: build-airwaves build-robo-rippa

build-airwaves:
	$(PYTHON) -m compileall -q dgn-airwaves/src

build-robo-rippa:
	$(PYTHON) -m compileall -q dgn-robo-rippa/src

package-config:
	@test -f "RoboDJ_Launcher.bat"
	@mkdir -p "$(ARTIFACT_DIR)"
	@find config -maxdepth 1 -type f \( -name "*.json" -o -name "*.signal" -o -name "*.lock" \) -print0 | xargs -0 tar -czf "$(CONFIG_ARCHIVE)"
	@echo "Build complete: $(CONFIG_ARCHIVE)"

qa:
	yamllint docker-compose.yaml
	markdownlint-cli2 "**/*.md" "!make-4.3/**"
	$(PYTHON) -m py_compile config/inspect_db.py

smoke:
	@echo "Smoke target: validating runtime artifacts"
	@test -f "RoboDJ_Launcher.bat"
	@echo "Smoke check complete"

run-airwaves:
	PYTHONPATH=dgn-airwaves/src $(PYTHON) -m dgn_airwaves.main

run-robo-rippa:
	PYTHONPATH=dgn-robo-rippa/src $(PYTHON) -m dgn_robo_rippa.main

check: build
	$(PYTHON) -m json.tool docs/architecture/event-schema.json > /dev/null

distcheck: check

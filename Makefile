.PHONY: help build build-all build-modules package-config qa smoke run-airwaves run-robo-rippa check distcheck install-deps
.PHONY: help build build-all build-modules package-config qa smoke run-airwaves run-robo-rippa check distcheck install-deps

PYTHON ?= python3
ARTIFACT_DIR ?= .artifacts
CONFIG_ARCHIVE ?= $(ARTIFACT_DIR)/dgn-dj-studio-config.tgz

PY_SOURCES = backend/ dgn-airwaves/src dgn-robo-rippa/src config/ scripts/

help:
	@echo "Targets:"
	@echo "  build / build-all / build-modules  Build all modules and package config artifact"
	@echo "  qa                                Run lint and basic Python checks"
	@echo "  smoke                             Validate required runtime files exist"
	@echo "  run-airwaves                      Run dgn-airwaves stub"
	@echo "  run-robo-rippa                    Run dgn-robo-rippa stub"
	@echo "  check                             Run all validation checks"
	@echo "  distcheck                         Alias of check for CI compatibility"

build: check package-config
build-all: build

build-modules:
	$(PYTHON) -m compileall -q $(PY_SOURCES)

package-config:
	@test -f "DGN-DJ_Launcher.bat"
	@mkdir -p "$(ARTIFACT_DIR)"
	@find config -maxdepth 1 -type f \( -name "*.json" -o -name "*.signal" -o -name "*.lock" \) -print0 | xargs -0 tar -czf "$(CONFIG_ARCHIVE)"
	@echo "Build complete: $(CONFIG_ARCHIVE)"

qa:
	yamllint docker-compose.yaml docker-compose.base.yml docker-compose.dev.yml docker-compose.staging.yml docker-compose.release.yml docker-compose.prod.yml
	markdownlint-cli2 "**/*.md" "!make-4.3/**"
	$(PYTHON) -m py_compile config/inspect_db.py

smoke:
	@echo "Smoke target: validating runtime artifacts"
	@test -f "DGN-DJ_Launcher.bat"
	@echo "Smoke check complete"

run-airwaves:
	PYTHONPATH=dgn-airwaves/src $(PYTHON) -m dgn_airwaves.main

run-robo-rippa:
	PYTHONPATH=dgn-robo-rippa/src $(PYTHON) -m dgn_robo_rippa.main

check: build-modules lint-backend secret-scan
	$(PYTHON) -m json.tool docs/architecture/event-schema.json > /dev/null

distcheck: check

# ── Sprint 1 additions ─────────────────────────────────────

dev:
	docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile dev up

dev-down:
	docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile dev down

test-backend:
	$(PYTHON) -m pytest backend/tests -x -q --tb=short

test-frontend:
	npm run test

lint-backend:
	$(PYTHON) -m ruff --version || $(MAKE) install-deps
	$(PYTHON) -m ruff check $(PY_SOURCES) --output-format=full

install-deps:
	$(PYTHON) -m pip install -r backend/requirements.lock

lint-frontend:
	npm run lint

secret-scan:
	$(PYTHON) scripts/check_no_secrets.py

migrate:
	$(PYTHON) -m alembic upgrade head

migrate-down:
	$(PYTHON) -m alembic downgrade -1

test: test-backend test-frontend

lint: lint-backend lint-frontend

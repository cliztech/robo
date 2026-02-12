.PHONY: help build build-all build-modules build-airwaves build-robo-rippa run-airwaves run-robo-rippa check distcheck

PYTHON ?= python3

help:
	@echo "Targets:"
	@echo "  build / build-all / build-modules  Build all modules"
	@echo "  build-airwaves                    Build dgn-airwaves only"
	@echo "  build-robo-rippa                  Build dgn-robo-rippa only"
	@echo "  run-airwaves                      Run dgn-airwaves stub"
	@echo "  run-robo-rippa                    Run dgn-robo-rippa stub"
	@echo "  check                             Run all validation checks"
	@echo "  distcheck                         Alias of check for CI compatibility"

build: build-modules
build-all: build-modules

build-modules: build-airwaves build-robo-rippa

build-airwaves:
	$(PYTHON) -m compileall -q dgn-airwaves/src

build-robo-rippa:
	$(PYTHON) -m compileall -q dgn-robo-rippa/src

run-airwaves:
	PYTHONPATH=dgn-airwaves/src $(PYTHON) -m dgn_airwaves.main

run-robo-rippa:
	PYTHONPATH=dgn-robo-rippa/src $(PYTHON) -m dgn_robo_rippa.main

check: build-modules
	$(PYTHON) -m json.tool docs/architecture/event-schema.json > /dev/null

distcheck: check

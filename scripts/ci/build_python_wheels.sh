#!/usr/bin/env bash
set -euo pipefail

# Build wheels into a dedicated artifact directory outside app source trees.
# Usage: scripts/ci/build_python_wheels.sh [output_dir]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="${1:-${ROOT_DIR}/.artifacts/python-packaging}"

mkdir -p "${OUT_DIR}/wheels" "${OUT_DIR}/tmp"
export TMPDIR="${OUT_DIR}/tmp"

python -m pip wheel --no-deps --wheel-dir "${OUT_DIR}/wheels" \
  "${ROOT_DIR}/dgn-airwaves" \
  "${ROOT_DIR}/dgn-robo-rippa"

echo "✅ Wheels written to ${OUT_DIR}/wheels"

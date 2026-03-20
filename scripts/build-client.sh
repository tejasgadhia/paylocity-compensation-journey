#!/usr/bin/env bash
# Copies deployable app files to dist/ for Catalyst client deploy.
# Usage: bash scripts/build-client.sh && catalyst deploy

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

# Core app files
cp "$ROOT/index.html" "$DIST/"
cp "$ROOT/app.js" "$DIST/"
cp "$ROOT/styles.css" "$DIST/"
cp "$ROOT/favicon.svg" "$DIST/"
cp "$ROOT/client-package.json" "$DIST/"

# JS modules
cp -r "$ROOT/js" "$DIST/js"

# Assets (fonts, Chart.js, images)
cp -r "$ROOT/assets" "$DIST/assets"

# Screenshots (used by landing page before/after comparison)
cp -r "$ROOT/screenshots" "$DIST/screenshots"

echo "Built dist/ ($(find "$DIST" -type f | wc -l | tr -d ' ') files)"

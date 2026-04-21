#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/artifacts/stockwatch"
BUILD_DIR="$APP_DIR/dist/public"

cd "$REPO_ROOT"

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$REMOTE_URL" ]]; then
  REPO_NAME="${GITHUB_PAGES_REPO_NAME:-$(basename -s .git "$REMOTE_URL")}"
else
  REPO_NAME="${GITHUB_PAGES_REPO_NAME:-stockwatch}"
fi

BASE_PATH="${GITHUB_PAGES_BASE_PATH:-/${REPO_NAME}/}"

# Use mock API so the local build matches GitHub Pages behavior.
export VITE_USE_MOCK=true

echo "Building StockWatch for a local GitHub Pages preview at base path: $BASE_PATH"
PORT=4173 BASE_PATH="$BASE_PATH" VITE_USE_MOCK=true pnpm --filter @workspace/stockwatch build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Expected build output was not found at $BUILD_DIR" >&2
  exit 1
fi

cp "$BUILD_DIR/index.html" "$BUILD_DIR/404.html"
touch "$BUILD_DIR/.nojekyll"

echo "Local GitHub Pages build is ready at: $BUILD_DIR"
echo "Preview it with: pnpm --filter @workspace/stockwatch serve"

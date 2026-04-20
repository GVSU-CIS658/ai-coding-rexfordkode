#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/artifacts/stockwatch"
BUILD_DIR="$APP_DIR/dist/public"
PAGES_DIR="$REPO_ROOT/.gh-pages-build"

cleanup() {
  rm -rf "$PAGES_DIR"
}

trap cleanup EXIT

cd "$REPO_ROOT"

REMOTE_URL="$(git remote get-url origin)"
REPO_NAME="${GITHUB_PAGES_REPO_NAME:-$(basename -s .git "$REMOTE_URL")}"
BASE_PATH="${GITHUB_PAGES_BASE_PATH:-/${REPO_NAME}/}"

echo "Building stockwatch for GitHub Pages at base path: $BASE_PATH"
pnpm install --frozen-lockfile
PORT=3000 BASE_PATH="$BASE_PATH" pnpm --filter @workspace/stockwatch build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Expected build output was not found at $BUILD_DIR" >&2
  exit 1
fi

# Create worktree for gh-pages branch
git worktree add "$PAGES_DIR" gh-pages 2>/dev/null || git worktree add -B gh-pages "$PAGES_DIR" HEAD

# Clear and copy new build
rm -rf "$PAGES_DIR"/*
rsync -a --delete "$BUILD_DIR"/ "$PAGES_DIR"/
touch "$PAGES_DIR/.nojekyll"

# Commit and push
cd "$PAGES_DIR"
git add -A

if git diff --cached --quiet; then
  echo "No deployment changes to publish."
  cd "$REPO_ROOT"
  git worktree remove "$PAGES_DIR" 2>/dev/null || true
  exit 0
fi

git commit -m "Deploy stockwatch to GitHub Pages"
git push origin gh-pages --force

cd "$REPO_ROOT"
git worktree remove "$PAGES_DIR" 2>/dev/null || true
echo "✅ Deployment complete!"
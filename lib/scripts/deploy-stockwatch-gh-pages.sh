#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/artifacts/stockwatch"
BUILD_DIR="$APP_DIR/dist/public"
TEMP_DIR="$(mktemp -d)"
PUBLISH_DIR="$TEMP_DIR/gh-pages"

cleanup() {
  rm -rf "$TEMP_DIR"
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

# Create a clean temp clone so only built assets are published
git clone --depth 1 --branch gh-pages "$REMOTE_URL" "$PUBLISH_DIR" 2>/dev/null || git clone --depth 1 "$REMOTE_URL" "$PUBLISH_DIR"

cd "$PUBLISH_DIR"

# Ensure gh-pages branch exists locally
if git show-ref --quiet refs/heads/gh-pages; then
  git checkout gh-pages
elif git show-ref --quiet refs/remotes/origin/gh-pages; then
  git checkout -B gh-pages origin/gh-pages
else
  git checkout --orphan gh-pages
fi

# Remove existing published files but keep git metadata
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

# Copy build output and publish
rsync -a "$BUILD_DIR"/ "$PUBLISH_DIR"/
touch "$PUBLISH_DIR/.nojekyll"

git add -A

if git diff --cached --quiet; then
  echo "No deployment changes to publish."
  exit 0
fi

git commit -m "Deploy stockwatch to GitHub Pages"
git push origin gh-pages --force

echo "✅ Deployment complete!"
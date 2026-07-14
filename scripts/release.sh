#!/usr/bin/env bash

set -euo pipefail

release="${1:?Pass major, minor, or patch}"

(
  cd packages/gust
  npm version "$release" \
    --no-git-tag-version \
    --workspaces=false
)

bun install --lockfile-only

version="$(node -p "require('./packages/gust/package.json').version")"
tag="v$version"

git add packages/gust/package.json bun.lock
git commit -m "release: $tag"
git tag -a "$tag" -m "$tag"

(
  cd packages/gust
  npm publish \
    --access public \
    --workspaces=false
)

git push origin main --follow-tags
gh release create "$tag" --verify-tag --generate-notes

#!/usr/bin/env bash

set -euo pipefail

release="${1:-patch}"

npm version "$release" \
  --workspace=@maniktherana/gust \
  --no-git-tag-version

bun install --lockfile-only

version="$(node -p "require('./packages/gust/package.json').version")"
tag="v$version"

git add packages/gust/package.json bun.lock
git commit -m "release: $tag"
git tag -a "$tag" -m "$tag"

npm publish \
  --workspace=@maniktherana/gust \
  --access public

git push origin main --follow-tags
gh release create "$tag" --verify-tag --generate-notes

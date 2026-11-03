#!/usr/bin/env bash

set -euo pipefail

release="${1:?Pass major, minor, patch, or --prepared}"

if [[ "$release" == "--prepared" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Commit the prepared release before publishing." >&2
    exit 1
  fi
else
  (
    cd packages/gust
    npm version "$release" \
      --no-git-tag-version \
      --workspaces=false
  )
  bun install --lockfile-only
fi

version="$(node -p "require('./packages/gust/package.json').version")"
tag="v$version"

if [[ "$release" != "--prepared" ]]; then
  git add packages/gust/package.json bun.lock
  git commit -m "release: $tag"
fi
git tag -a "$tag" -m "$tag"

(
  cd packages/gust
  npm publish \
    --access public \
    --workspaces=false
)

git push origin main --follow-tags
gh release create "$tag" --verify-tag --generate-notes

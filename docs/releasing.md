# Releasing Gust

Gust is distributed as source through the shadcn GitHub registry. The version in `packages/gust/package.json` is copied into the registry item's metadata; the Git tag is the immutable install reference.

## Release checklist

1. Update `packages/gust/package.json` and the root `package.json` to the same semantic version.
2. Record user-facing changes in the GitHub release notes.
3. Run `bun run registry:build` and commit the regenerated `registry.json`.
4. Run `bun run verify`.
5. Commit the release, create an annotated `vX.Y.Z` tag, and push the commit and tag.

The tag workflow reruns the complete release gate and creates the corresponding GitHub release.

Consumers can follow the latest default branch:

```sh
bunx shadcn@latest add maniktherana/gust/gust
```

Or install the immutable tag:

```sh
bunx shadcn@latest add maniktherana/gust/gust#vX.Y.Z
```

No registry server is required. GitHub, `registry.json`, the referenced source files, and the release tag are the distribution surface.

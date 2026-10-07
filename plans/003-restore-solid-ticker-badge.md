# 003 — Restore the ticker badge's solid tint

Status: COMPLETE. Verified against the final implementation; see [final review](FINAL-REVIEW.md).

- **Commit:** 84617d9
- **Severity:** MEDIUM
- **Category:** Cohesion
- **Estimated scope:** One ticker component

## Problem and current code

`apps/site/src/components/demos/ticker-demo.tsx:135` mixes `currentColor` 12% with `transparent`. The graph now shows through the badge. HEAD used a 12% tint mixed with the solid raised surface.

## Target

Use `backgroundColor: "color-mix(in oklab, currentColor 12%, var(--surface-raised))"`. Retain the existing semantic foreground color and graph/motion behavior. `git show HEAD:apps/site/src/components/demos/ticker-demo.tsx` is the historical evidence and exemplar.

## Steps and scope

Replace only the translucent background class with the solid inline mix. Optional pause support is needed for the new graph example, but must preserve the homepage defaults. Do not restore removed color tokens or alter graph behavior.

## Verification

- Inspect computed color: opaque in light and dark themes.
- Screenshot: the line does not show through the price badge.
- Typecheck and lint pass.

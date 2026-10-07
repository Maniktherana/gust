# 002 — Simplify the reference and show stagger directly

Status: COMPLETE. Verified against the final implementation; see [final review](FINAL-REVIEW.md).

- **Commit:** 84617d9
- **Severity:** MEDIUM
- **Category:** Purpose, cohesion, performance
- **Estimated scope:** Three reference component files

## Problem and current code

`apps/site/src/components/reference/charts.tsx:57` renders `TimeRange` with `0` and duration labels below every curve. `:143` labels dashed reference lines. `StaggerChart` renders a ruler, letter rows, and millisecond labels, using animated `left` and `width`.

`apps/site/src/components/reference/props.tsx:337` labels Arriving/Leaving; `:435` renders kept/leave/arrive counts; `:448` renders the Kept/Leaving/Arriving legend. These details are explicitly unwanted by the user.

## Target

Curve plots contain only a full-height faint 4×4 grid, the actual curve, and its value marker. Remove the dashed baseline, baseline labels, and external time range. Remove the direction legend and prefix counts/legend. Preserve controls and live text.

Replace the stagger timeline with a single centered horizontal row of small dots, one per animated arriving character, with a 440ms opacity pulse and per-dot delay equal to `bar.delay`. Pulse opacity from 0.15 to 1 then back to 0.15 with the established strong ease-out `cubic-bezier(0.16, 1, 0.3, 1)`. Synchronize its replay to each actual preview value change. At stagger 0 every dot pulses together; at 80ms they pulse left to right. No ruler, numbers, letters, labels, or layout-property animation. Pause decorative pulses offscreen/reduced motion.

## Conventions and steps

1. Match the existing `Grid`, `ChartWell`, `PreviewWell`, and `useMotionPreview` structure.
2. Delete obsolete time-range/baseline props and associated chart data; retain meaningful marker readouts.
3. Remove the extra reference legends/counts and update descriptive copy to match the simpler illustrations.
4. Replace StaggerChart with the direct dot wave. Add a replay signal to the preview hook only if necessary to match actual changes; preserve all existing consumers.
5. Use opacity only, no parent-driven animated CSS variables. Keep the dots aria-hidden and static under reduced motion.

## Out of scope

Do not modify examples, ticker, Gust engine, public defaults, or unrelated existing edits. Do not add a library.

## Verification

- Typecheck/lint; browser check every requested removal.
- At stagger 0 dots pulse simultaneously; at 80ms sequentially, in time with the text above.
- Initial display must not show an unrelated pulse before the text first changes.
- Check manual Next, autoplay, and slider changes, including rapid changes.
- Reduced motion keeps dots static; offscreen rows pause.

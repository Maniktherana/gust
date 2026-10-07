# Final motion review — October 2, 2026

The gallery layout and three removed examples were superseded by the [landing carousel and globe](004-landing-carousel.md). This record preserves the earlier work.

| Before                                                                              | After                                                                                                         | Why                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Wind units moved, decrypt text jumped, and some cards had little useful interaction | Eight product examples; fixed units, readable stages and independently tuned Gust values                      | Each animation now communicates a real changing state                  |
| Growing digits drifted sideways in centered or end-aligned layouts                  | Core width morph compensates root movement and preserves the exit glyph position                              | Explicit vertical travel remains vertical across digit-count changes   |
| Flight figures used large jumps, lacked visible blur and lost exits at the boundary | Exact 7m changes every 200ms, seconds once a second, entry/exit blur and visible travel margins               | Matches the measured reference cadence with the user's final step size |
| Username typing was plain and status transitions collided                           | Gust input overlay over a native input; complete transition plus reading hold for hints                       | Keeps editing usable and validation readable                           |
| Token count grew independently from the chat and reserved empty suffix space        | Persistent phased transcript, seven-second thinking, activity shimmer and phase-driven usage; conditional `k` | Usage advances with the task and stops with the final reply            |
| Large swatches and a focus ring around the entire button                            | 24px squares, 8px visual gaps, 2px selected ring gap; keyboard focus hugs the square                          | Makes the picker compact while keeping selection and focus visible     |
| Music title motion was replaced with generic vertical text motion                   | Hex uses horizontal Gust motion with overshoot 24 and selected-colour text                                    | Preserves the requested song-title character movement                  |
| Download had file context, unrelated controls and an incomplete arrow loop          | One download/progress button, locally masked arrow into the tray and existing badge-check swap                | The component reads as a single download action                        |
| Motion controls omitted available axes and mixed different text elements            | Separate complete DialKit profiles, entrance scale below 1 and consistent travel/blur names                   | Every animated element can be tuned independently                      |
| Reference diagrams contained legends, time axes and an unexplained `g`              | Minimal plots/dots, no unwanted legends, central direction dot                                                | Removes clutter while retaining live controls                          |

## Verdict

**Approve.** The final read-only source review found no remaining concrete defects after the copied Live price import was corrected in [gallery integration](/Users/manik/code/gust/apps/site/src/components/examples/index.ts:29).

The latest swatch refinement is in [color-swatches.tsx](/Users/manik/code/gust/apps/site/src/components/examples/color-swatches.tsx:118). Browser measurements confirm 32px cells and 24px squares in both axes. Focus applies a 2px outline with a 2px offset to the inner square; the button itself has no outline. The selected colour now uses the latest requested 2px outline gap. Explicit angles still win, and the Down control now overrides automatic selection direction.

## Validation

- Package: 49 passing tests and 5,331 assertions, including 26 width/alignment regression cases and the original 68-frame default-motion fixture. Package typecheck, lint, formatting and build passed.
- Site: 4 passing tests and 63 assertions. Final site typecheck, lint, formatting, registry generation/check and client/SSR/server build passed. `git diff --check` passed.
- Browser: download completion and restart; native username editing with Gust text and settled validation; clock Home/End transitions through Gust; centered counter at three/four digits; completed token transcript and stable final count; compact swatches and keyboard focus; canonical DialKit controls; removed homepage legends/time labels.
- Flight: ten ordinary screenshots sampled over about one second show 98→91→84→77→70→63 metres. Computed styles contain both entrance and exit blur; visible glyph bounds remain inside the card. This verifies the measured state cadence and visible effects, rather than inferring them from source alone.

[Final gallery screenshot](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/examples-final.jpg), [swatch focus screenshot](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/swatches-final.jpg), [flight frame montage](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/flight-final-frames.jpg), [flight measurements](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/flight-final-samples.json).

The supplied video was analyzed offline as individual frames. No browser screen recording or denied recording bypass was used. Reduced-motion behavior was reviewed in source; no claim of physical-device motion-sensitivity testing. Build output still contains existing nonfatal chunk-size and Shiki WebAssembly fallback messages.

Default entrance blur remains zero and exit blur remains four pixels. The API rename preserves the default keyframes exactly; migration guidance covers existing explicit configurations. All existing dirty workspace changes were retained.

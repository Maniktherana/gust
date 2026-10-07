# 001 — Useful Gust examples

Status: COMPLETE. Original audit baseline: commit `84617d9`. Later user corrections supersede the initial tuning plan.

The final gallery has eight cards: Flight, Live price, Time of day, Counter, AI task/token count, Color picker, Username validation and Download. Flight spans two columns. Visible card names/captions are removed; accessible names and copy prompts remain. Wind, Breathe, Decrypt, Slots and the standalone agent run were replaced or removed from the gallery.

Each example was assigned to an independent subagent at the user's request. The coordinator integrated profiles and verified the final gallery. Pre-existing workspace changes remain intact.

## Final implementation

- Flight has a centered plane and looping map. Seconds update once a second; metres change by exactly 7 every 200ms. The latest user cadence overrides earlier faster configurations. Both readouts use vertical Gust entry/exit, 4px entrance/exit blur and zero overshoot. Units stay still. Captions sit close above the numbers, with room for outgoing characters below. Play/pause uses rounded shapes and an icon swap.
- Live price reuses the homepage's original ticker motion and opaque price badge. Its copy prompt includes the required Liveline patch and a standalone implementation.
- Time of day loops forward through midnight. The solid moon and smooth orbit accompany a staggered greeting and Gust clock. The regular-font tabular clock is centered above the slider. Manual time changes use Gust too.
- Counter has no guest suffix and counts through 9→10, 99→100 and 999→1000. The number stays centered between stationary controls.
- AI task keeps the user prompt, Thinking, assistant stream, subagent activity and final reply as a transcript. Status items use Gust and shimmer; chat paragraphs stream normally. Token growth follows the seven-second thinking and subagent stages, slows during spoken replies, and stops on the final word at 100k. The count is left-aligned; `k` only occupies space when present. Replay is an icon.
- Color picker has nine 24px colour squares with 8px gaps. Selected colour uses a matching outline with a 2px gap; keyboard focus hugs the square. A larger coloured hex uses the former song-title horizontal motion with entrance overshoot 24. Clicks select; autoplay chooses a different colour every two seconds.
- Username uses Gust for typed text over a real editable input. Validation states wait for their full animation plus a reading hold before changing. Input and hint have separate tuning panels.
- Download is one integrated button. Its percentage uses Gust with a static percent suffix. The exact download arrow disappears below the static tray through a local mask, then swaps to the existing badge-check icon. Completion remains until restart. No pause/play controls or file context.

Each distinct animated text element has its own development DialKit panel. Offscreen examples pause. Reduced motion disables decorative autoplay and replaces travel/scale/blur with fades.

## Component correction and API

Gust now compensates for root-width alignment changes during digit growth/shrink, so vertical character motion stays vertical in left, centered and right aligned layouts. Exit glyphs retain their prior viewport position. This is fixed inside the component rather than hidden with caller-specific width workarounds.

Travel uses `entranceHeight`/`exitHeight`; entry bounce uses `entranceOvershoot`; blur uses `entranceBlur`/`exitBlur`. All callers were migrated without changing their numeric values. The default animation still matches all 68 original keyframes exactly. Entrance scale can be below 1.

## Verification

See [final review](FINAL-REVIEW.md) for automated checks, browser evidence and limitations. User-supplied videos were inspected as offline frames. Live evidence uses ordinary screenshots; no screen recording or raw recorder bypass.

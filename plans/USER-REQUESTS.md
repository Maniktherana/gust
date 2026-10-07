# User request checklist

- Remove dashed reference baselines and labels such as normal size / no blur.
- Remove external graph time scales; grid covers the entire plot.
- Restore the homepage price badge's earlier opaque tinted background.
- Inspect torph.lochie.me/examples directly; make original examples appropriate to Gust.
- Remove visible example names/captions.
- Remove Breathe.
- Remove excessive bounce; text settles rather than overshooting.
- Replace the rapid suffix/reel demonstrations with a useful live graph/price example.
- Good morning must move smoothly throughout, without hard time steps.
- Remove kept/leave/arrive counts and the prefix legend.
- Remove Arriving/Leaving direction legend.
- Replace the stagger timeline with a direct minimal illustration.
- Weather: mph remains static; only the number animates.
- Weather: changing digit widths cannot move the compass/layout.
- Remove the unreadable decrypt example.
- Username: states wait until their animation finishes, then remain readable before changing again.
- Remove the standalone Agent run card; put any fixed seconds suffix outside Gust.
- Add an original plane/map example based on the supplied video: plane centered, map looping beneath, changing bottom readouts with fixed units.
- Delegate one subagent per example, then coordinate and review all outputs.
- Username: make Gust's changing validation hint visible and verify its rendered transitions; keep typing immediate.
- Replace Lucide playback symbols with rounded filled play/pause shapes and an animated icon swap, including flight, player, and download controls. Keep copy/tick icons.
- Flight: digits must arrive vertically from above without moving sideways when the number gains a digit; increase the distance rate to match a plane.
- Flight: use regular font with tabular numbers, a tight gap before the fixed unit, and integer meters changing quickly (four updates per second).
- Time of day: loop forward through midnight; use a solid moon, centered clock, and a cleaner full-width slider beneath. Use regular font and tabular numbers rather than mono.
- Username: animate typed characters with Gust as in the phone OTP demo; preserve a real editable input and keep validation transitions settled/readable.
- Download: remove the empty space between the playback icon and its label; center the actual pair with an 8px gap.
- Download: show a useful file-transfer state, use vertical staggered label changes, update MB quickly, and avoid sideways-looking movement.
- Flight: replace large meter jumps with a continuous countdown, restore clearly visible character travel and exit blur (the supplied video remains the reference).
- Preserve all pre-existing dirty workspace changes.
- Do not retry or bypass denied raw browser recording access. User-supplied video can be inspected frame by frame with ordinary file tools; final live verification uses ordinary screenshots and actual baked keyframes.

## Later corrections (override conflicting earlier requests)

- Replace Wind with an AI task/token demo. Latest version shows the user asking to add Gust to a hero heading, Thinking, concise task progress, a subagent stage, then confirmation that the hero uses Gust. Remove the long generic text stream. Display thousands with `k`, up to 100k, and show only a replay icon on completion.
- Keep tokens/status independently tunable in DialKit. Earlier long-stream/no-user-message requests are superseded by the compact task scenario.
- Remove the visible guests/guest suffix. Count through 9→10, 99→100, and 999→1000. Keep the number centred between stationary buttons.
- Replace the music player with a dedicated agent's color picker: 3×3 swatches, selected hex above, click selection, random different selection every two seconds, actual Gust on the hex.
- Download is one integrated download button. Remove file context, MB context, pause/play controls and all right-side action icons. Put percentage inside the button with a static percent suffix.
- Download uses the original download icon paths. Its arrow loops from above fully into/below the tray and disappears through an arrow-only mask; the tray stays still. On completion swap to the existing filled badge-check from the copy controls, then back to download on restart.
- Download label and percentage need separate DialKit controls. No pausing. Leave the completed state until restart.
- Flight follows measured frame timing from the supplied video, with visible blur and travel instead of clipped motion, violent bounce or per-frame replacement. Reference updates meters about five times/second and seconds once/second.
- Latest flight pacing: distance changes by exactly 7 metres at the same 200ms cadence; seconds and distance remain consistent. This overrides the earlier fast 150m/s pacing.
- Flight captions stay close above their figures. Keep clear space below so exit characters remain visible within the card. No wide vertical gap or line-box crop.
- No cropping of entry/exit characters in examples generally. Mask only deliberate local assets such as the download arrow, progress fill, or horizontal input window.
- Day clock always uses Gust, including slider interaction. Forward continuous day loop resets at midnight; centred regular-font clock, opaque moon, visible per-character greeting stagger.
- Every different Gust element in one demo has its own DialKit profile. Keep the development DialKit visible as on the homepage.
- Entrance scale may be below 1. Allow the 0–2 range in controls and engine, without changing the default.
- Fix digit-count growth/shrink direction inside Gust itself. A number gaining a digit must not acquire a sideways entrance because its width changes. Caller-specific fixed width or disabled animation is not the fix.
- Rework Agent guide and copied instructions to describe real Gust use: fixed units outside the component, separate label/counter profiles, readable stage timing, correct angles, visible travel, blur and regular tabular digits.
- User requested an explicit list of unfinished items; given on October 2 during work. Final status must reflect actual tests and screenshot review rather than implementation alone.

## Final refinements and verification — October 2

- Token demo is a persistent chat: the prompt, Thinking, streamed assistant reply, plain subagent activity line, and final streamed reply remain as separate items. New items fade in. Working/Thinking use the official shadcn shimmer utility.
- Token count is left-aligned with the transcript. Only render `k` when present, with no reserved empty space. Thinking lasts 7 seconds and counts quickly; spoken replies count slowly; the subagent counts quickly. Stop on the final word at 100k.
- Color picker preserves the song title's horizontal Gust motion, with entrance overshoot 24, larger selected-colour hex text, smaller swatches, and a matching 2px selected outline. Earlier selected outline gap request: 4px. Latest correction: reduce that gap to 2px. Keep 24px colour squares in 32px cells, giving an 8px visual gap. Keyboard focus surrounds the square, not the outer cell.
- New motion axes are available consistently in each DialKit profile. Entrance scale accepts values below 1. Explicit angles override Down; Down overrides automatic demo direction.
- Final API names: `entranceHeight` and `exitHeight` for travel, `entranceOvershoot` for entry bounce, `entranceBlur` and `exitBlur` for pixel blur. No exit overshoot. Keep all previous default animation frames unchanged. Migrate all homepage and example callers and documentation.
- Replace the unexplained direction-diagram `g` with a central dot.
- Browser verification confirms 32px swatch cells, 24px squares, an inner keyboard focus outline, exact 7m flight samples at the 200ms cadence, real entry/exit blur, centered counter, Gust-rendered clock, animated input/settled validation, and download completion/restart.
- Final source review approved after removing a duplicate type import from the copied Live price component. Package/site tests, typecheck, lint, registry generation and builds passed. The final review contains the evidence and its limits.

## Landing-page carousel — latest direction

- Remove Username, Time of day/Good night and AI token count examples. Their registry entries, source components and copied prompt setup are removed.
- Move the remaining five examples (Flight, Live price, Counter, Color picker, Download) onto the landing page alongside the four original headline/status/copy/OTP demos. No separate examples page or navigation link. Old `/examples` and `/lab` addresses redirect home.
- Replace the hero stack with a native horizontally scrollable, full-viewport-width carousel. Cards recede and turn inward toward the edges; the documentation below keeps its narrow layout. Keyboard arrows/Home/End and previous/next controls work. Pointer focus does not recenter cards during a click.
- Remove the flight pause button. Offscreen, document-hidden and reduced-motion pausing remain automatic.
- Replace the flight terrain map with real COBE. The globe is large and zoomed in, rotating below a static plane; retain existing meter cadence and Gust tuning. Added cobe2.0.1 and included it in the copied flight prompt's dependencies.
- These requests supersede earlier instructions to keep the removed examples, use a terrain map and show a flight pause button. No Gust engine changes in this task.
- Verified desktop and small-screen viewport widths, card interactions, route redirect, COBE rendering and fixed plane. Site typecheck/lint/tests/registry check and production build pass; final source review approved. See plan004 for current evidence.

### Carousel and globe corrections — latest requests

- Use one coherent inward-curving band, based on the supplied carousel screenshot. Remove independent card perspectives, finite ends and navigation arrow buttons.
- The carousel loops infinitely and drifts continuously. Dragging moves it in either direction; horizontal trackpad scrolling also works. All visible examples remain interactive. No selected/front/main card, click recentering, or snapping on release.
- Prevent an example click only after an actual drag gesture. Ordinary clicks reach the example controls wherever their card appears.
- Move the globe surface downward beneath the upward-pointing stationary plane.
- Add progressive scenery blur in the flight footer region so labels and numbers remain readable. The readouts themselves stay sharp, and their Gust entry/exit travel remains visible.
- Repeat browser and source checks after these changes; previous completion evidence predates this direction.

### Final landing refinements — supersede the curve request

- Remove the curve completely. No perspective, card rotation, angle skewing or depth. Every demo card is 288px tall, with variable widths and equal 16px gaps.
- Keep continuous infinite movement, pointer dragging, horizontal wheel navigation and normal interactions with every visible demo. No carousel arrows or snapping.
- Use a grayscale globe and background, with the globe moving downward under the static upward-facing plane.
- Follow the Motion Primitives progressive-blur pattern: gentle upper layers, increasing blur toward the footer, sharp text above. Clip the complete flight scene once to its rounded corners; overscan blur beneath the boundary to avoid an unblurred corner seam.
- Correct the Building circular arrow's rotation. Tailwind's spin shorthand must include reverse so it cannot reset the separately declared direction.
- Remove the "When Gust fits" and "Prompts" sections from the landing page, along with their unused local helpers and imports. Completed; typecheck and targeted lint/format checks pass.

## Strip, grid and focus — October 7

Reference: [Kit Langton's infinite wgpu canvas](https://x.com/kitlangton/status/2107266189441581545). A simplified version: strip → grid → focused card, with the recording's motion.

- Keep the strip's drift, drag, wheel and fast-motion lens.
- Clicking a strip card lifts every card onto a full-screen stage and folds the strip into a grid. No labels or text. Cards keep the strip's left-to-right order and their relative sizes, in centred, evenly filled rows.
- Clicking a grid card zooms the camera in to centre and fit it. Neighbours stay visible at the edges. Clicking a neighbour pans to it; arrow keys do the same.
- A back/X button sits top left: X closes the grid, the back arrow leaves focus. Escape steps back too. Clicking the empty stage steps out one level, so the grid returns to the strip.
- Only the focused card takes input. Strip and grid cards are covered by a button and their demos are inert. This supersedes the earlier request that ordinary clicks reach the examples in the strip.
- Motion measured frame by frame from the recording (60fps): zooming in and out both follow a critically damped spring, ω ≈ 12.6 rad/s on the log of the zoom. About 50% at 133ms, 96% by 400ms, settled by about 500ms. The strip ↔ grid fold uses the same spring. Every card gets directional motion blur from its edge speeds, and the page behind fades on a spring twice as fast.
- Correction: the transitions were too slow. The stage spring now runs at 24 rad/s, about twice the recording's pace: half way at 70ms and within 2% by 250ms. Motion blur is lighter (at most 10px), its filter region is smaller, and cards off screen skip it, because blurring live demos was costing frames.
- Correction: Gust broke inside the scaled grid and focused card. It measured characters in on-screen pixels but wrote offsets and widths in its own CSS pixels. Fixed inside Gust itself: every measurement is divided by the root's on-screen scale, so Gust works under any transformed or zoomed ancestor.
- Correction: zooming into focus showed blocky, pixelated cards and stalled frames. The per-card SVG blur repainted every live demo through a filter each frame, at the wrong resolution once scaled. Motion blur is now CSS `blur()` (at most 8px). While the motion is fast, each card has its own GPU layer, so moving and blurring it never repaints the demo. Once the blur fades the layers are dropped, so the slow end of the zoom and the resting card are drawn sharp at their real size.

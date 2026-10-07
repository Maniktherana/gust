# 004 — Flat landing carousel and grayscale flight globe

Status: COMPLETE. This final flat strip supersedes the earlier curve request and separate examples page.

The landing page contains Flight, Live price, Counter, Color picker and Download alongside the original headline/status/copy/OTP demos. Username, Good night and Tokens were removed. The old examples and lab routes redirect home.

Every card is 288px tall, with variable widths and equal 16px gaps. There is no perspective, rotation, skew, depth, selected main card, snapping or carousel arrow UI. Nine unique live examples drift at 36px/s and wrap beyond the viewport. Pointer dragging and horizontal wheel scrolling move the strip. Ordinary clicks reach the examples; only a real drag suppresses its click. Wide-screen widths preserve coverage. Server markup uses a normal row before initialization.

Flight uses real [COBE](https://cobe.vercel.app/) with a grayscale globe and background. Its surface moves downward beneath the upward-facing stationary plane. The pause button is removed. Existing Gust profiles, fixed units and exact 7m/200ms cadence are retained.

The footer follows the layered masks from [Motion Primitives progressive blur](https://motion-primitives.com/docs/progressive-blur). Eight bands grow from 0 to 16px, with gentle upper layers. The entire scene shares one rounded clip; blur extends 2px beneath the edges to avoid a sharp corner seam. Plane, labels and readouts remain above the blur and stay sharp.

The Building circular arrow now includes reverse direction in its animation shorthand. Tailwind's spin shorthand had overridden the separate direction property. Browser computed style confirms reverse spin. Original Gust profiles and engine defaults were preserved.

Browser checks used native clicks, drags and individual screenshots. At 1894px, more than a full cycle of dragging retained equal 288px heights and 16px gaps. A swatch click selected the requested color without recentering. At 3840px, another full cycle had no empty boundary or visible wrap, with the same heights and gaps. At 390px, document and carousel widths were both 390px, without horizontal document overflow. All transforms are translation only. The final reload reported no browser errors. The plane remains at the same relative position inside the moving flight card.

Reduced motion removes automatic drift. Offscreen/document-hidden guards and cleanup remain in the carousel and demos. These branches were source-reviewed; no new OS preference emulation or physical-device test was performed.

Formatting, typecheck, lint, four site tests/63 assertions, registry check and production build passed. Existing nonfatal bundle-size/Shiki build messages remain. An SVG hydration mismatch from tiny Bun/browser trigonometric differences was resolved by rounding direction-diagram coordinates to four decimals.

Implementation: [carousel](/Users/manik/code/gust/apps/site/src/components/demo-carousel.tsx), [styles](/Users/manik/code/gust/apps/site/src/components/demo-carousel.css), [flight](/Users/manik/code/gust/apps/site/src/components/examples/flight.tsx), [status](/Users/manik/code/gust/apps/site/src/components/demos/status-demo.tsx).

Evidence: [landing screenshot](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/landing-carousel.jpg), [flight screenshot](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/flight-earth-detail.jpg), [wide screen](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/carousel-wide-final.jpg), [small screen](/Users/manik/.codex/visualizations/2026/10/02/01a0fcca-a08b-7a80-9dda-d74c3452666b/carousel-mobile.jpg).

The preview remains running at localhost:3003. Existing workspace changes are preserved. No recording, commit or deployment.

import * as React from "react";

import "./demo-carousel.css";

export type CarouselSlide = {
  content: React.ReactNode;
  id: string;
  title: string;
  width?: number;
};

const useLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
const wrap = (distance: number, length: number) =>
  ((((distance + length / 2) % length) + length) % length) - length / 2;
const ease = (current: number, target: number, seconds: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-dt / seconds));

const GAP = 16;
const CRUISE = 36;
// The row opens with a fast spin, in px/s, that slows to the cruise speed on the first slide.
const INTRO = 6000;
// How long, in seconds, a fling or the intro takes to slow toward the cruise speed.
const FRICTION = 0.45;
// Once the intro spin slows below this speed, in px/s, the rest of the page fades in.
const SETTLED = 500;
// How much taller the lens makes the middle of the frame at full swell. At rest it is flat, so
// the demos stay crisp; bending live HTML is only clean while it moves.
const SWELL = 0.4;
// The most blur, in px, the lens adds at full swell to smooth the filter's unfiltered sampling.
const SOFTEN = 0.5;
// The share of that growth the lens also gives in width.
const WIDEN = 0.5;
// Clicks the lens moves away from what they land on in the layout.
const INTERACTIVE = "a[href], button, input, label, select, summary, textarea, [role='button']";

const lensBump = (u: number) => (1 + Math.cos(Math.PI * u)) / 2;
// The largest |u × lensBump(u)|, so the horizontal pull uses the map's full range.
const LENS_PULL = 0.27;
let lensMap: string | undefined;

// A displacement map for a lens one unit wide each way. Red pulls pixels toward the middle
// column and green toward the middle row; 0.5 (and blue everywhere) means no movement.
function drawLensMap() {
  if (lensMap) return lensMap;
  const columns = 512;
  const rows = 256;
  const canvas = document.createElement("canvas");
  canvas.width = columns;
  canvas.height = rows;
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  const image = context.createImageData(columns, rows);
  for (let column = 0; column < columns; column += 1) {
    const u = ((column + 0.5) / columns) * 2 - 1;
    const bump = lensBump(u);
    for (let row = 0; row < rows; row += 1) {
      const v = ((row + 0.5) / rows) * 2 - 1;
      const index = (row * columns + column) * 4;
      image.data[index] = Math.round(255 * (0.5 - (0.5 * u * bump) / LENS_PULL));
      image.data[index + 1] = Math.round(255 * (0.5 - 0.5 * v * bump));
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  lensMap = canvas.toDataURL();
  return lensMap;
}

// Every demo stays mounted once while the row loops past the viewport. A lens fixed in the
// middle of the frame bends whatever passes through it while the row moves fast, then flattens
// as it settles. It is an SVG filter over the whole row, so it never touches the demos' layout.
export function DemoCarousel({
  initialSlide,
  slides,
}: {
  initialSlide: string;
  slides: CarouselSlide[];
}) {
  const lensId = `demo-lens-${React.useId().replace(/[^\w-]/g, "")}`;
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLOListElement>(null);
  const filterRef = React.useRef<SVGFilterElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const filter = filterRef.current;
    if (!viewport || !track || !filter) return undefined;
    const [map, pullX, pullY, soften] = [
      filter.querySelector("feImage"),
      ...filter.querySelectorAll("feDisplacementMap"),
      filter.querySelector("feGaussianBlur"),
    ] as [
      SVGFEImageElement,
      SVGFEDisplacementMapElement,
      SVGFEDisplacementMapElement,
      SVGFEGaussianBlurElement,
    ];

    const slots = Array.from(track.children) as HTMLLIElement[];
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let centers: number[] = [];
    let cycle = 0;
    let radius = 0;
    let offset = 0;
    let lastOffset = 0;
    let velocity = media.matches ? CRUISE : INTRO;
    let pending = 0;
    let speed = 0;
    let lens = 0;
    let lensReady = false;
    let lensFade = 0;
    let pull = 0;
    let reach = 0;
    let disposed = false;
    let frame = 0;
    let previousTime = 0;
    let visible = true;
    let keyboardFocus = false;
    let pointerFocus = false;
    let holdUntil = 0;
    let ignoreClick = false;
    let clickReset = 0;
    let drag: { id: number; x: number; y: number; offset: number; moved: boolean } | null = null;
    let introDone = false;

    // Marks the intro as over, which reveals everything marked data-intro-after.
    const finishIntro = () => {
      if (introDone) return;
      introDone = true;
      viewport.dataset.intro = "done";
    };

    const initial = Math.max(
      0,
      slides.findIndex((slide) => slide.id === initialSlide),
    );

    const nearestTo = (position: number) => {
      let nearest = 0;
      let nearestDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = Math.abs(wrap(center - position, cycle));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });
      return nearest;
    };

    // The lens's raised-cosine profile across the frame, from its middle.
    const bump = (x: number) => (Math.abs(x) < radius ? lensBump(x / radius) : 0);

    const paint = () => {
      centers.forEach((center, index) => {
        slots[index]!.style.transform = `translateX(${wrap(center - offset, cycle)}px)`;
      });

      const strength = lens * lens * (3 - 2 * lens) * lensFade;
      const amount = SWELL * strength;
      // The map pulls each pixel toward the middle, so this is exact at the lens's peak.
      const next = amount / (1 + amount);
      if (Math.abs(next - pull) < 1e-4) return;
      if (next < 1e-3) track.style.removeProperty("filter");
      else {
        pullX.setAttribute("scale", String(2 * WIDEN * next * radius * LENS_PULL));
        pullY.setAttribute("scale", String(2 * next * reach));
        soften.setAttribute("stdDeviation", String(SOFTEN * strength));
        if (pull < 1e-3) track.style.filter = `url(#${lensId})`;
      }
      pull = next < 1e-3 ? 0 : next;
    };

    // The layout point a pointer at (x, y) sees through the lens.
    const throughLens = (x: number, y: number) => {
      const box = track.getBoundingClientRect();
      const fromMiddle = x - box.left - box.width / 2;
      const bend = pull * bump(fromMiddle);
      return [x - WIDEN * bend * fromMiddle, y - bend * (y - box.top - box.height / 2)] as const;
    };

    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || media.matches) return;
      const dt = previousTime ? Math.min(Math.max(time - previousTime, 0), 64) / 1000 : 0;
      previousTime = time;

      if (dt > 0) {
        if (!drag) {
          // A fling relaxes back to the cruise speed, and wheel input drains in smoothly.
          velocity = ease(velocity, keyboardFocus || time < holdUntil ? 0 : CRUISE, FRICTION, dt);
          if (Math.abs(velocity) < SETTLED) finishIntro();
          const step = pending - ease(pending, 0, 0.12, dt);
          pending -= step;
          offset += velocity * dt + step;
        }

        speed = ease(speed, (offset - lastOffset) / dt, 0.05, dt);
        const swell = Math.min(1, Math.max(0, (Math.abs(speed) - 240) / 1800));
        lens = ease(lens, swell, swell > lens ? 0.08 : 0.3, dt);
        if (lens < 0.001) lens = 0;
        lensFade = ease(lensFade, lensReady ? 1 : 0, 0.1, dt);
        if (!drag) offset = wrap(offset, cycle);
      }

      lastOffset = offset;
      paint();
      frame = requestAnimationFrame(tick);
    };

    const resume = () => {
      if (frame || !visible || document.hidden || media.matches) return;
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    };

    const moveBy = (distance: number) => {
      if (frame) {
        pending += distance;
        return;
      }
      offset += distance + pending;
      pending = 0;
      paint();
    };

    const centerSlide = (index: number) => {
      const center = centers[index];
      if (center === undefined) return;
      moveBy(wrap(center - offset - pending, cycle));
    };

    const measure = () => {
      const current = centers.length ? nearestTo(offset + pending) : initial;
      // Keep the row where it was relative to the nearest slide. The first time, start far
      // enough back that the intro spin coasts to a stop on the initial slide.
      const shift = centers.length ? offset - centers[current]! : -(velocity - CRUISE) * FRICTION;
      let cursor = 0;
      const widths = slots.map((slot) => Number.parseFloat(getComputedStyle(slot).width));
      centers = widths.map((width, index) => {
        const center = cursor + width / 2;
        cursor += width + GAP;
        slots[index]!.style.marginLeft = `${-width / 2}px`;
        return center;
      });
      cycle = cursor;
      // Reaches about two slides out from the middle, so neighbours bend as they approach it.
      radius = (2 * (cycle - GAP * slots.length)) / slots.length;
      // The filter covers the row plus room above and below for slides to swell into.
      const frameWidth = track.clientWidth;
      const frameHeight = track.clientHeight;
      reach = frameHeight * 0.75;
      pull = -1;
      for (const [element, x, width] of [
        [filter, 0, frameWidth],
        [map, frameWidth / 2 - radius, 2 * radius],
      ] as const) {
        element.setAttribute("x", String(x));
        element.setAttribute("y", String(frameHeight / 2 - reach));
        element.setAttribute("width", String(width));
        element.setAttribute("height", String(2 * reach));
      }
      offset = (centers[current] ?? 0) + shift;
      lastOffset = offset;
      paint();
    };

    const pointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      // Pressing catches the row, so a fling or wheel glide stops under the pointer.
      offset += pending;
      pending = 0;
      velocity = 0;
      finishIntro();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, moved: false };
      holdUntil = performance.now() + 800;
      pointerFocus = true;
      keyboardFocus = false;
    };

    const pointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;
        drag.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.dataset.dragging = "true";
      }
      event.preventDefault();
      offset = drag.offset - dx;
      paint();
    };

    const pointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      ignoreClick = drag.moved && event.type !== "pointercancel";
      if (ignoreClick) velocity = Math.min(Math.max(speed, -5000), 5000);
      window.clearTimeout(clickReset);
      clickReset = window.setTimeout(() => {
        ignoreClick = false;
      }, 0);
      drag = null;
      delete viewport.dataset.dragging;
      if (viewport.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId);
      holdUntil = 0;
      resume();
    };

    const click = (event: MouseEvent) => {
      if (ignoreClick) {
        ignoreClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // The filter moves pixels but not hit areas, so send a pointer click to what it looked
      // like it hit. Keyboard clicks (detail 0) already have the right target.
      if (!pull || !event.isTrusted || event.detail === 0) return;
      const [x, y] = throughLens(event.clientX, event.clientY);
      const seen = document.elementFromPoint(x, y)?.closest<HTMLElement>(INTERACTIVE);
      const target = seen && viewport.contains(seen) ? seen : null;
      if (target === (event.target as Element).closest(INTERACTIVE)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      target?.focus({ preventScroll: true });
      target?.click();
    };

    const wheel = (event: WheelEvent) => {
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      holdUntil = performance.now() + 800;
      moveBy(event.deltaX || event.deltaY);
    };

    const keyDown = (event: KeyboardEvent) => {
      pointerFocus = false;
      if (!(event.target instanceof Node) || !viewport.contains(event.target)) return;
      keyboardFocus = true;
      if (event.target !== viewport) return;
      const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (!direction && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      centerSlide(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? slots.length - 1
            : (nearestTo(offset + pending) + direction + slots.length) % slots.length,
      );
    };

    const focusIn = (event: FocusEvent) => {
      if (pointerFocus) return;
      keyboardFocus = true;
      const slot = (event.target as HTMLElement).closest<HTMLLIElement>(".demo-carousel__slot");
      if (slot) centerSlide(Number(slot.dataset.index));
    };

    const focusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && viewport.contains(event.relatedTarget)) return;
      keyboardFocus = false;
      resume();
    };

    const updateActivity = () => {
      if (media.matches) lens = 0;
      // Nothing will play the intro while it is out of view or motion is reduced.
      if (!visible || media.matches) finishIntro();
      paint();
      if (!visible || document.hidden || media.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else resume();
    };

    const mapUrl = drawLensMap();
    if (mapUrl) {
      map.setAttribute("href", mapUrl);
      // Wait for the map to decode, or the filter would briefly shift the whole row.
      const image = new Image();
      image.src = mapUrl;
      image
        .decode()
        .then(() => {
          if (disposed) return;
          lensReady = true;
          if (frame) return;
          lensFade = 1;
          paint();
        })
        .catch(() => undefined);
    }

    measure();
    viewport.dataset.ready = "true";
    if (media.matches) finishIntro();
    // Never leave the page hidden if the spin cannot run.
    const introTimeout = window.setTimeout(finishIntro, 4000);
    const resize = new ResizeObserver(measure);
    resize.observe(viewport);
    slots.forEach((slot) => resize.observe(slot));
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      updateActivity();
    });
    intersection.observe(viewport);
    viewport.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    viewport.addEventListener("click", click, true);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("focusin", focusIn);
    viewport.addEventListener("focusout", focusOut);
    window.addEventListener("keydown", keyDown, true);
    document.addEventListener("visibilitychange", updateActivity);
    media.addEventListener("change", updateActivity);
    resume();

    return () => {
      disposed = true;
      window.clearTimeout(introTimeout);
      delete viewport.dataset.ready;
      delete viewport.dataset.intro;
      track.style.removeProperty("filter");
      slots.forEach((slot) => {
        slot.style.removeProperty("transform");
        slot.style.removeProperty("margin-left");
      });
      cancelAnimationFrame(frame);
      window.clearTimeout(clickReset);
      resize.disconnect();
      intersection.disconnect();
      viewport.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("focusin", focusIn);
      viewport.removeEventListener("focusout", focusOut);
      window.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("visibilitychange", updateActivity);
      media.removeEventListener("change", updateActivity);
    };
  }, [initialSlide, lensId, slides]);

  return (
    <section className="demo-carousel" aria-label="Gust demos">
      <svg aria-hidden="true" className="demo-carousel__lens" focusable="false">
        <filter
          ref={filterRef}
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          id={lensId}
          primitiveUnits="userSpaceOnUse"
        >
          <feFlood floodColor="rgb(128 128 128)" result="still" />
          <feImage preserveAspectRatio="none" result="bend" />
          <feComposite in="bend" in2="still" operator="over" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            result="wide"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feDisplacementMap
            in="wide"
            in2="map"
            result="bent"
            scale="0"
            xChannelSelector="B"
            yChannelSelector="G"
          />
          <feGaussianBlur in="bent" stdDeviation="0" />
        </filter>
      </svg>
      <div
        ref={viewportRef}
        aria-label="Interactive Gust demos. Drag or use the arrow keys to browse."
        aria-roledescription="carousel"
        className="demo-carousel__viewport"
        role="region"
        tabIndex={0}
      >
        <ol ref={trackRef} className="demo-carousel__track">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              aria-label={`${slide.title}, ${index + 1} of ${slides.length}`}
              aria-roledescription="slide"
              className="demo-carousel__slot"
              data-index={index}
              data-slide={slide.id}
              style={{
                width: `min(max(${slide.width ?? 320}px, ${((slide.width ?? 320) / 18).toFixed(6)}vw), calc(100vw - 48px))`,
              }}
            >
              <div className="demo-carousel__surface">{slide.content}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

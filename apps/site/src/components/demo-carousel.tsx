import * as React from "react";
import { ArrowLeftIcon, XIcon } from "lucide-react";

import {
  focusCamera,
  layoutGrid,
  springStep,
  STAGE_SPRING,
  type Camera,
  type Placement,
  type Size,
} from "./demo-carousel-stage";
import { setStageMoving } from "@/hooks/use-stage-motion";
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
// How long, in seconds, the stage's motion blur exposes each frame. A card blurs by how fast its
// fastest edge moves, so it softens most while it zooms or flies.
const EXPOSURE = 1 / 1200;
// The most motion blur, in screen px, a card gets. Only devices with a fine pointer draw it;
// blurring several layers every frame is too much for most phone GPUs.
const MAX_BLUR = 8;
// Blur below this, in a card's own px, is not worth drawing.
const BLUR_FLOOR = 0.25;
// The most a focused card is enlarged from its natural size, so its canvases stay fairly sharp
// on very large screens.
const MAX_FOCUS = 3;
// How often, in seconds, the springs are sampled into keyframes, and the longest a motion runs.
const SAMPLE = 1 / 120;
const MAX_MOTION = 2;

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

type Mode = "strip" | "grid" | "focus";
// A card's place on the stage before the camera, as a spring per axis. The scale springs in log
// space, so growing and shrinking by the same factor take the same time.
type Body = { logScale: number; vLogScale: number; vx: number; vy: number; x: number; y: number };
// The camera's springs, with its zoom in log space too.
type View = { logZoom: number; vLogZoom: number; vx: number; vy: number; x: number; y: number };
type StageState = { bodies: Body[]; camera: View; fade: number; vFade: number };
// One frame of the stage: each card's transform and motion blur, and the backdrop's opacity.
type StageFrame = { cards: { blur: number; transform: string }[]; fade: number };

// Every demo stays mounted once while the row loops past the viewport. A lens fixed in the
// middle of the frame bends whatever passes through it while the row moves fast, then flattens
// as it settles. It is an SVG filter over the whole row, so it never touches the demos' layout.
//
// Clicking a card lifts the whole row onto a full-screen stage and folds it into a grid.
// Clicking a card in the grid zooms the camera in on it, and only that card takes input. Going
// back, or clicking the empty stage, steps out one level at a time.
export function DemoCarousel({
  initialSlide,
  slides,
}: {
  initialSlide: string;
  slides: CarouselSlide[];
}) {
  const lensId = `demo-lens-${React.useId().replace(/[^\w-]/g, "")}`;
  const sectionRef = React.useRef<HTMLElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLOListElement>(null);
  const filterRef = React.useRef<SVGFilterElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const filter = filterRef.current;
    const backdrop = backdropRef.current;
    const close = closeRef.current;
    if (!section || !viewport || !track || !filter || !backdrop || !close) return undefined;
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
    const surfaces = slots.map(
      (slot) => slot.querySelector<HTMLElement>(".demo-carousel__surface")!,
    );
    const openers = slots.map(
      (slot) => slot.querySelector<HTMLButtonElement>(".demo-carousel__open")!,
    );
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    // A mouse or trackpad. Touch screens wake the lens at swipe speeds and skip motion blur.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    // Only Chromium draws an SVG filter over live HTML on the GPU. Safari, every iOS browser
    // and Firefox filter it in software, which cannot keep up while the row moves, so they get
    // the lens drawn with transforms instead, and no motion blur. Only Chromium has
    // navigator.userAgentData.
    const filterLens = "userAgentData" in navigator;
    let centers: number[] = [];
    let sizes: Size[] = [];
    let slotTop = 0;
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
    let stripWidth = 0;
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

    // The stage. While it is up, the row is fixed over the page and every card is placed by the
    // springs below instead of the strip.
    let staged = false;
    let mode: Mode = "strip";
    let focused = -1;
    // The card last zoomed in on. The strip comes back centred on it.
    let lastFocused = -1;
    // The grid's reading order: the strip's cards from left to right when it folded.
    let order: number[] = [];
    let bodies: Body[] = [];
    let targets: Placement[] = [];
    let camera: View = { logZoom: 0, vLogZoom: 0, vx: 0, vy: 0, x: 0, y: 0 };
    let cameraTarget: Camera = { x: 0, y: 0, zoom: 1 };
    let fade = 0;
    let vFade = 0;
    // The browser's animations for the motion in flight, and which motion they belong to.
    let motions: Animation[] = [];
    let motionId = 0;
    let locked = false;
    let inerted: HTMLElement[] = [];
    let rootStyle = { gutter: "", overflow: "" };
    let stageSize: Size = { height: 0, width: 0 };

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

    // Without the filter, the lens moves and stretches whole cards instead of bending pixels,
    // which the compositor can do every frame. Its map magnifies the middle of the row and pushes the
    // rest outward, so the cards swell through the middle without overlapping.
    const paintWarp = () => {
      if (pull) {
        track.style.removeProperty("filter");
        pull = 0;
      }
      const strength = lens * lens * (3 - 2 * lens);
      const widen = SWELL * WIDEN * strength;
      const spread = (x: number) =>
        Math.abs(x) >= radius
          ? x + (Math.sign(x) * widen * radius) / 2
          : x + widen * (x / 2 + (radius / (2 * Math.PI)) * Math.sin((Math.PI * x) / radius));
      centers.forEach((center, index) => {
        const position = wrap(center - offset, cycle);
        if (!widen) {
          slots[index]!.style.transform = `translateX(${position}px)`;
          return;
        }
        const half = sizes[index]!.width / 2;
        const left = spread(position - half);
        const right = spread(position + half);
        const scaleX = (right - left) / (2 * half);
        const scaleY = 1 + SWELL * strength * bump(position);
        slots[index]!.style.transform =
          `translateX(${(left + right) / 2}px) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
      });
    };

    const paintStrip = () => {
      if (!filterLens) {
        paintWarp();
        return;
      }
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

    // Read once per lift or resize, so working out a motion never waits on layout.
    const readStage = () => {
      stageSize = {
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth,
      };
    };

    // Where a card sits in the strip, in screen coordinates.
    const stripPlacement = (index: number, box: DOMRect): Placement => ({
      scale: 1,
      x: box.left + box.width / 2 + wrap(centers[index]! - offset, cycle) - sizes[index]!.width / 2,
      y: box.top + slotTop,
    });

    // Points every spring at the layout for the current mode.
    const retarget = () => {
      const middle = { x: stageSize.width / 2, y: stageSize.height / 2, zoom: 1 };
      if (mode === "strip") {
        const box = viewport.getBoundingClientRect();
        targets = slots.map((_, index) => stripPlacement(index, box));
        cameraTarget = middle;
        return;
      }
      const grid = layoutGrid({ frame: stageSize, gap: GAP, order, sizes });
      targets = grid.placements;
      cameraTarget =
        mode === "focus"
          ? focusCamera(targets[focused]!, sizes[focused]!, stageSize, MAX_FOCUS)
          : middle;
    };

    const fadeTarget = () => (mode === "strip" ? 0 : 1);

    // Every spring, `seconds` into the current motion. The springs are solved exactly, so any
    // moment can be worked out directly from where the motion began.
    const stateAt = (seconds: number): StageState => {
      const at = (value: number, rate: number, target: number, omega = STAGE_SPRING) =>
        springStep(value, rate, target, seconds, omega);
      const [cameraX, cameraVx] = at(camera.x, camera.vx, cameraTarget.x);
      const [cameraY, cameraVy] = at(camera.y, camera.vy, cameraTarget.y);
      const [logZoom, vLogZoom] = at(camera.logZoom, camera.vLogZoom, Math.log(cameraTarget.zoom));
      // The page behind clears out faster than the cards travel, so they fly over a clean stage.
      const [nextFade, nextVFade] = at(fade, vFade, fadeTarget(), 2 * STAGE_SPRING);
      return {
        bodies: bodies.map((body, index) => {
          const target = targets[index]!;
          const [x, vx] = at(body.x, body.vx, target.x);
          const [y, vy] = at(body.y, body.vy, target.y);
          const [logScale, vLogScale] = at(body.logScale, body.vLogScale, Math.log(target.scale));
          return { logScale, vLogScale, vx, vy, x, y };
        }),
        camera: { logZoom, vLogZoom, vx: cameraVx, vy: cameraVy, x: cameraX, y: cameraY },
        fade: nextFade,
        vFade: nextVFade,
      };
    };

    const restState = (): StageState => ({
      bodies: targets.map(({ scale, x, y }) => ({
        logScale: Math.log(scale),
        vLogScale: 0,
        vx: 0,
        vy: 0,
        x,
        y,
      })),
      camera: {
        logZoom: Math.log(cameraTarget.zoom),
        vLogZoom: 0,
        vx: 0,
        vy: 0,
        x: cameraTarget.x,
        y: cameraTarget.y,
      },
      fade: fadeTarget(),
      vFade: 0,
    });

    // Whether every spring has come within a fraction of a pixel of its target, and stopped.
    const restingAt = (state: StageState) => {
      const near = (value: number, rate: number, target: number, tolerance: number) =>
        Math.abs(value - target) < tolerance && Math.abs(rate) < tolerance * 10;
      const view = state.camera;
      const pixel = 0.2 / Math.exp(view.logZoom);
      return (
        state.bodies.every((body, index) => {
          const target = targets[index]!;
          return (
            near(body.x, body.vx, target.x, pixel) &&
            near(body.y, body.vy, target.y, pixel) &&
            near(body.logScale, body.vLogScale, Math.log(target.scale), 2e-4)
          );
        }) &&
        near(view.x, view.vx, cameraTarget.x, pixel) &&
        near(view.y, view.vy, cameraTarget.y, pixel) &&
        near(view.logZoom, view.vLogZoom, Math.log(cameraTarget.zoom), 2e-4) &&
        near(state.fade, state.vFade, fadeTarget(), 2e-3)
      );
    };

    // How every card looks for one state of the springs, through the camera. A resting frame
    // lands the corners on device pixels so the demos' text stays sharp.
    const drawState = (state: StageState, resting: boolean): StageFrame => {
      const view = state.camera;
      const zoom = Math.exp(view.logZoom);
      const zoomRate = zoom * view.vLogZoom;
      const pixel = window.devicePixelRatio || 1;
      const snap = (value: number) => (resting ? Math.round(value * pixel) / pixel : value);
      const blurring = filterLens && finePointer.matches && !resting;
      return {
        cards: state.bodies.map((body, index) => {
          const { width, height } = sizes[index]!;
          const scale = Math.exp(body.logScale) * zoom;
          const x = (body.x - view.x) * zoom + stageSize.width / 2;
          const y = (body.y - view.y) * zoom + stageSize.height / 2;
          const transform = `translate(${snap(x)}px, ${snap(y)}px) scale(${scale.toFixed(5)})`;
          // Cards off screen are never seen, and the card zooming into focus stays sharp.
          const offscreen =
            x > stageSize.width ||
            y > stageSize.height ||
            x + width * scale < 0 ||
            y + height * scale < 0;
          if (!blurring || offscreen || (mode === "focus" && index === focused)) {
            return { blur: 0, transform };
          }
          // How fast each edge moves on screen, from the springs' own velocities.
          const vx = (body.vx - view.vx) * zoom + (body.x - view.x) * zoomRate;
          const vy = (body.vy - view.vy) * zoom + (body.y - view.y) * zoomRate;
          const vScale = scale * (body.vLogScale + view.vLogZoom);
          const speed = Math.max(
            Math.abs(vx),
            Math.abs(vx + width * vScale),
            Math.abs(vy),
            Math.abs(vy + height * vScale),
          );
          const blur = Math.min(MAX_BLUR, speed * EXPOSURE) / scale;
          return { blur: blur < BLUR_FLOOR ? 0 : blur, transform };
        }),
        fade: Math.min(1, Math.max(0, state.fade)),
      };
    };

    const writeFrame = ({ cards, fade: shade }: StageFrame) => {
      cards.forEach(({ blur, transform }, index) => {
        const slot = slots[index]!;
        slot.style.transform = transform;
        if (blur) slot.style.filter = `blur(${blur.toFixed(2)}px)`;
        else slot.style.removeProperty("filter");
      });
      backdrop.style.opacity = String(shade);
    };

    // How far into the running motion the browser has played, in seconds, so a change
    // mid-flight starts from exactly where the cards are.
    const elapsed = () => {
      const time = motions[0]?.currentTime;
      return typeof time === "number" ? time / 1000 : 0;
    };

    // Moves the springs' starting point up to the present, before their targets change. At rest
    // they are already there.
    const freeze = () => {
      if (!motions.length) return;
      const now = stateAt(elapsed());
      bodies = now.bodies;
      camera = now.camera;
      fade = now.fade;
      vFade = now.vFade;
    };

    // Hands one whole motion to the browser as keyframes, sampled from the springs until they
    // rest. The compositor plays them with no script per frame, so the cards stay smooth even
    // while the page is busy, and the browser draws each card at the largest size it reaches,
    // so a card zooming into focus stays sharp. The demos pause meanwhile, so their timers and
    // canvases leave the frames to the motion.
    const animateStage = () => {
      motionId += 1;
      const id = motionId;
      motions.forEach((motion) => motion.cancel());
      motions = [];
      const samples: StageFrame[] = [];
      if (!media.matches) {
        for (let time = 0; time < MAX_MOTION; time += SAMPLE) {
          const state = stateAt(time);
          if (restingAt(state)) break;
          samples.push(drawState(state, false));
        }
      }
      const final = drawState(restState(), true);
      samples.push(final);
      // The cards' own styles hold the last frame, so nothing moves when the animations end.
      writeFrame(final);

      if (samples.length < 2 || typeof backdrop.animate !== "function") {
        finishMotion();
        return;
      }
      const timing = {
        duration: (samples.length - 1) * SAMPLE * 1000,
        easing: "linear",
        fill: "both",
      } satisfies KeyframeAnimationOptions;
      const offsetOf = (frameIndex: number) => frameIndex / (samples.length - 1);
      motions = slots.map((slot, index) => {
        const blurs = samples.some((sample) => sample.cards[index]!.blur > 0);
        return slot.animate(
          samples.map((sample, frameIndex) => ({
            offset: offsetOf(frameIndex),
            transform: sample.cards[index]!.transform,
            ...(blurs ? { filter: `blur(${sample.cards[index]!.blur.toFixed(2)}px)` } : {}),
          })),
          timing,
        );
      });
      motions.push(
        backdrop.animate(
          samples.map((sample, frameIndex) => ({
            offset: offsetOf(frameIndex),
            opacity: sample.fade,
          })),
          timing,
        ),
      );
      setStageMoving(true);
      motions[0]!.finished.then(
        () => {
          if (id === motionId) finishMotion();
        },
        () => undefined,
      );
    };

    // Keeps the page still and out of reach while the stage covers it. It restyles the whole
    // page, so it waits until the stage first comes to rest; until then the stage itself
    // swallows touches and wheel input.
    const lockPage = () => {
      if (locked) return;
      locked = true;
      const root = document.documentElement;
      rootStyle = { gutter: root.style.scrollbarGutter, overflow: root.style.overflow };
      root.style.scrollbarGutter = "stable";
      root.style.overflow = "hidden";
      for (let node: Element = section; node.parentElement; node = node.parentElement) {
        if (node === document.body) break;
        for (const sibling of node.parentElement.children) {
          if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
          sibling.inert = true;
          inerted.push(sibling);
        }
      }
    };

    const unlockPage = () => {
      if (!locked) return;
      locked = false;
      const root = document.documentElement;
      root.style.scrollbarGutter = rootStyle.gutter;
      root.style.overflow = rootStyle.overflow;
      inerted.forEach((element) => {
        element.inert = false;
      });
      inerted = [];
    };

    // Settles the springs on their targets and drops the finished animations, which the cards'
    // own styles already match, then lets the demos run again.
    const finishMotion = () => {
      const rest = restState();
      bodies = rest.bodies;
      camera = rest.camera;
      fade = rest.fade;
      vFade = 0;
      motions.forEach((motion) => motion.cancel());
      motions = [];
      setStageMoving(false);
      if (mode === "strip") settle();
      else lockPage();
    };

    // Lifts the strip onto the stage exactly where it is, so nothing moves until the springs do.
    const lift = () => {
      if (staged) return;
      finishIntro();
      // Wheel input still draining in has not been drawn yet, so it is dropped.
      offset = wrap(offset, cycle);
      pending = 0;
      velocity = 0;
      lens = 0;
      lastFocused = -1;
      readStage();
      const box = viewport.getBoundingClientRect();
      const positions = centers.map((center) => wrap(center - offset, cycle));
      order = slots.map((_, index) => index).sort((a, b) => positions[a]! - positions[b]!);
      bodies = slots.map((_, index) => {
        const { x, y } = stripPlacement(index, box);
        return { logScale: 0, vLogScale: 0, vx: 0, vy: 0, x, y };
      });
      camera = {
        logZoom: 0,
        vLogZoom: 0,
        vx: 0,
        vy: 0,
        x: stageSize.width / 2,
        y: stageSize.height / 2,
      };
      fade = 0;
      vFade = 0;
      track.style.removeProperty("filter");
      pull = 0;
      staged = true;
      section.dataset.staged = "true";
      writeFrame(drawState({ bodies, camera, fade, vFade }, false));
    };

    // Puts the cards back in the strip once they have landed there.
    const settle = () => {
      staged = false;
      delete section.dataset.staged;
      unlockPage();
      backdrop.style.removeProperty("opacity");
      slots.forEach((slot) => slot.style.removeProperty("filter"));
      lastOffset = offset;
      speed = 0;
      velocity = 0;
      holdUntil = performance.now() + 400;
      paintStrip();
      resume();
    };

    const setMode = (next: Mode, index = -1) => {
      if (staged) freeze();
      mode = next;
      focused = next === "focus" ? index : -1;
      section.dataset.stage = next;
      slots.forEach((_, slot) => {
        const active = slot === focused;
        const label = next === "strip" ? "Show all demos" : `Open ${slides[slot]!.title}`;
        // Only the focused card takes input. Elsewhere a button over each card catches clicks.
        // Each write restyles a whole demo, so unchanged values are left alone.
        if (surfaces[slot]!.inert === active) surfaces[slot]!.inert = !active;
        if (openers[slot]!.hidden !== active) openers[slot]!.hidden = active;
        if (openers[slot]!.getAttribute("aria-label") !== label)
          openers[slot]!.setAttribute("aria-label", label);
      });
      close.setAttribute("aria-label", next === "focus" ? "Back to all demos" : "Close demos");
      if (!staged) return;
      retarget();
      animateStage();
    };

    const openGrid = () => {
      lift();
      setMode("grid");
    };

    const focusSlide = (index: number) => {
      const hadFocus = section.contains(document.activeElement);
      lastFocused = index;
      setMode("focus", index);
      if (hadFocus) slots[index]!.focus({ preventScroll: true });
    };

    // Steps out one level: from a focused card to the grid, and from the grid to the strip.
    const back = () => {
      const hadFocus = section.contains(document.activeElement);
      if (mode === "focus") {
        const index = focused;
        setMode("grid");
        if (hadFocus) openers[index]!.focus({ preventScroll: true });
        return;
      }
      if (mode !== "grid") return;
      // The strip comes back centred on the last card zoomed in on.
      if (lastFocused >= 0) offset = centers[lastFocused]!;
      velocity = 0;
      pending = 0;
      setMode("strip");
      if (hadFocus) openers[Math.max(0, lastFocused)]!.focus({ preventScroll: true });
    };

    // The layout point a pointer at (x, y) sees through the lens.
    const throughLens = (x: number, y: number) => {
      const box = track.getBoundingClientRect();
      const fromMiddle = x - box.left - box.width / 2;
      const bend = pull * bump(fromMiddle);
      return [x - WIDEN * bend * fromMiddle, y - bend * (y - box.top - box.height / 2)] as const;
    };

    // While the stage is up the browser plays its motion, so the strip's frame loop rests.
    const stopped = () => document.hidden || staged || !visible || media.matches;

    const tick = (time: number) => {
      frame = 0;
      if (stopped()) return;
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
        // A phone swipe is far slower in px/s than a desktop flick, so on touch screens the lens
        // wakes and fills by the screen's width per second instead.
        const [wake, fill] = finePointer.matches
          ? [240, 1800]
          : [Math.max(80, 0.2 * stripWidth), Math.max(400, 1.2 * stripWidth)];
        const swell = Math.min(1, Math.max(0, (Math.abs(speed) - wake) / fill));
        lens = ease(lens, swell, swell > lens ? 0.08 : 0.3, dt);
        if (lens < 0.001) lens = 0;
        lensFade = ease(lensFade, lensReady ? 1 : 0, 0.1, dt);
        if (!drag) offset = wrap(offset, cycle);
      }

      lastOffset = offset;
      paintStrip();
      frame = requestAnimationFrame(tick);
    };

    const paint = () => {
      if (!staged) paintStrip();
    };

    const resume = () => {
      if (frame || stopped()) return;
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
      sizes = slots.map((slot) => ({
        height: slot.offsetHeight,
        width: Number.parseFloat(getComputedStyle(slot).width),
      }));
      centers = sizes.map(({ width }, index) => {
        const center = cursor + width / 2;
        cursor += width + GAP;
        slots[index]!.style.marginLeft = `${-width / 2}px`;
        return center;
      });
      if (!staged) slotTop = slots[0]?.offsetTop ?? 0;
      cycle = cursor;
      // Reaches about two slides out from the middle, so neighbours bend as they approach it.
      radius = (2 * (cycle - GAP * slots.length)) / slots.length;
      // The filter covers the row plus room above and below for slides to swell into.
      const frameWidth = viewport.clientWidth;
      stripWidth = frameWidth;
      const frameHeight = viewport.clientHeight;
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
      if (staged) {
        pull = 0;
        freeze();
        readStage();
        retarget();
        animateStage();
      }
      paint();
    };

    const pointerDown = (event: PointerEvent) => {
      if (staged || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0))
        return;
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

    // A card's button opens the grid from the strip, and zooms in on that card from the grid.
    // A click on the empty stage steps back out.
    const stageClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const opener = target.closest<HTMLButtonElement>(".demo-carousel__open");
      if (opener) {
        const index = Number(opener.dataset.index);
        if (mode === "strip") openGrid();
        else focusSlide(index);
        return;
      }
      if (staged && !target.closest(".demo-carousel__slot")) back();
    };

    const wheel = (event: WheelEvent) => {
      // Nothing scrolls on the stage, and a sideways swipe there would go back a page.
      if (staged) {
        event.preventDefault();
        return;
      }
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      holdUntil = performance.now() + 800;
      moveBy(event.deltaX || event.deltaY);
    };

    const stageKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        back();
        return;
      }
      if (mode !== "focus") return;
      const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      // Arrow keys inside the focused demo belong to the demo.
      const inside = event.target instanceof Node && slots[focused]!.contains(event.target);
      if (!direction || (inside && event.target !== slots[focused])) return;
      event.preventDefault();
      const position = order.indexOf(focused);
      focusSlide(order[(position + direction + order.length) % order.length]!);
    };

    const keyDown = (event: KeyboardEvent) => {
      pointerFocus = false;
      if (staged) {
        if (mode !== "strip") stageKeyDown(event);
        return;
      }
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
      if (staged || pointerFocus) return;
      keyboardFocus = true;
      const slot = (event.target as HTMLElement).closest<HTMLLIElement>(".demo-carousel__slot");
      if (slot) centerSlide(Number(slot.dataset.index));
    };

    const focusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && viewport.contains(event.relatedTarget)) return;
      keyboardFocus = false;
      resume();
    };

    const resizeStage = () => {
      if (!staged) return;
      freeze();
      readStage();
      retarget();
      animateStage();
    };

    const updateActivity = () => {
      if (media.matches) lens = 0;
      // Nothing will play the intro while it is out of view or motion is reduced.
      if (!visible || media.matches) finishIntro();
      paint();
      if (stopped()) {
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
          if (frame || staged) return;
          lensFade = 1;
          paint();
        })
        .catch(() => undefined);
    }

    section.dataset.warp = filterLens ? "filter" : "transform";
    measure();
    setMode("strip");
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
    track.addEventListener("click", stageClick);
    close.addEventListener("click", back);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("focusin", focusIn);
    viewport.addEventListener("focusout", focusOut);
    window.addEventListener("keydown", keyDown, true);
    window.addEventListener("resize", resizeStage);
    document.addEventListener("visibilitychange", updateActivity);
    media.addEventListener("change", updateActivity);
    resume();

    return () => {
      disposed = true;
      motionId += 1;
      motions.forEach((motion) => motion.cancel());
      window.clearTimeout(introTimeout);
      unlockPage();
      setStageMoving(false);
      delete section.dataset.staged;
      delete section.dataset.stage;
      delete section.dataset.warp;
      delete viewport.dataset.ready;
      delete viewport.dataset.intro;
      backdrop.style.removeProperty("opacity");
      track.style.removeProperty("filter");
      slots.forEach((slot, index) => {
        slot.style.removeProperty("transform");
        slot.style.removeProperty("margin-left");
        slot.style.removeProperty("filter");
        slot.style.removeProperty("will-change");
        surfaces[index]!.inert = false;
        openers[index]!.hidden = false;
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
      track.removeEventListener("click", stageClick);
      close.removeEventListener("click", back);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("focusin", focusIn);
      viewport.removeEventListener("focusout", focusOut);
      window.removeEventListener("keydown", keyDown, true);
      window.removeEventListener("resize", resizeStage);
      document.removeEventListener("visibilitychange", updateActivity);
      media.removeEventListener("change", updateActivity);
    };
  }, [initialSlide, lensId, slides]);

  return (
    <section ref={sectionRef} className="demo-carousel" aria-label="Gust demos">
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
      <button
        ref={closeRef}
        type="button"
        className="demo-carousel__close"
        aria-label="Close demos"
      >
        <XIcon aria-hidden="true" className="demo-carousel__close-icon" data-icon="close" />
        <ArrowLeftIcon aria-hidden="true" className="demo-carousel__close-icon" data-icon="back" />
      </button>
      <div ref={backdropRef} aria-hidden="true" className="demo-carousel__backdrop" />
      <div
        ref={viewportRef}
        aria-label="Interactive Gust demos. Drag or use the arrow keys to browse, and open a demo to see them all."
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
              tabIndex={-1}
            >
              <div className="demo-carousel__surface">{slide.content}</div>
              <button
                aria-label="Show all demos"
                className="demo-carousel__open"
                data-index={index}
                type="button"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { describe, expect, test } from "bun:test";

import { cubicBezier } from "../src/easing";
import { animateGustRootWidth } from "../src/hooks";
import { resolveGustConfig } from "../src/config";
import { buildEnterKeyframes, buildExitKeyframes } from "../src/keyframes";
import { measureElementRect, measureGustCharacterSlots } from "../src/measure";

type Alignment = "left" | "center" | "right";
const layoutEase = cubicBezier(0.16, 1, 0.3, 1);

// A deterministic browser-geometry stand-in: each width change moves an
// inline element according to its parent alignment. WAAPI effects are sampled
// at the same clock so assertions include both layout and glyph translation.
class LayoutElement {
  style = { left: "0px", translate: "0px 0px" };
  effects: LayoutAnimation[] = [];
  ownerDocument = { hidden: false };
  isConnected = true;
  constructor(
    readonly scene: LayoutScene,
    readonly part: "root" | "glyph" | "exit" | "slot",
    readonly index = 0,
  ) {}
  animate(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const effect = new LayoutAnimation(this, keyframes, options, this.scene.time);
    this.effects.push(effect);
    return effect as unknown as Animation;
  }
  value(property: "width" | "left" | "translate" | "transform", fallback: number) {
    if (property === "width" && this.scene.widthOverride) return fallback;
    const effect = [...this.effects]
      .reverse()
      .find((candidate) => candidate.active && candidate.has(property));
    return effect?.sample(property) ?? fallback;
  }
  querySelectorAll() {
    return this.scene.glyphs;
  }
  querySelector() {
    return this.scene.glyphs[this.index];
  }
  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    const width = this.part === "root" ? this.value("width", this.scene.width) : 10;
    const left =
      this.part === "root"
        ? this.scene.left(width)
        : this.scene.root.getBoundingClientRect().left +
          (this.part === "glyph" || this.part === "slot" ? this.index * 10 : 0) +
          this.value("left", Number.parseFloat(this.style.left)) +
          this.value("translate", Number.parseFloat(this.style.translate)) +
          this.value("transform", 0);
    return { left, top: 0, width, height: 20 };
  }
}
class LayoutAnimation {
  active = true;
  constructor(
    readonly element: LayoutElement,
    readonly frames: Keyframe[],
    readonly options: KeyframeAnimationOptions,
    readonly start: number,
  ) {}
  has(property: string) {
    return this.frames[0][property] !== undefined;
  }
  sample(property: "width" | "left" | "translate" | "transform") {
    const duration = Number(this.options.duration);
    const advance =
      property === "translate" || property === "transform"
        ? this.element.scene.compositorAdvance
        : 0;
    const progress = Math.min(
      1,
      Math.max(0, (this.element.scene.time + advance - this.start) / duration),
    );
    const eased = this.options.easing === "linear" ? progress : layoutEase(progress);
    const sample =
      property === "transform"
        ? (value: unknown) => Number(String(value).match(/translate\(([^e]+)em/)?.[1] ?? 0) * 20
        : (value: unknown) => Number.parseFloat(String(value));
    const index = this.frames.findIndex(
      (frame, frameIndex) => Number(frame.offset ?? frameIndex / (this.frames.length - 1)) >= eased,
    );
    const beforeIndex = Math.max(0, index - 1);
    const before = this.frames[beforeIndex];
    const after = this.frames[Math.max(0, index)];
    const fromOffset = Number(before.offset ?? beforeIndex / (this.frames.length - 1));
    const toOffset = Number(after.offset ?? Math.max(0, index) / (this.frames.length - 1));
    const fraction = toOffset > fromOffset ? (eased - fromOffset) / (toOffset - fromOffset) : 0;
    const from = sample(before[property]);
    const to = sample(after[property]);
    return from + (to - from) * fraction;
  }
  cancel() {
    this.active = false;
  }
}
class LayoutScene {
  time = 0;
  compositorAdvance = 0;
  width = 10;
  widthOverride = false;
  root = new LayoutElement(this, "root");
  exit = new LayoutElement(this, "exit");
  glyphs: LayoutElement[] = [];
  slots = new Map<number, HTMLSpanElement>();
  constructor(readonly alignment: Alignment) {}
  left(width: number) {
    return this.alignment === "left" ? 20 : 100 - width * (this.alignment === "right" ? 1 : 0.5);
  }
  commit(width: number) {
    this.width = width;
    this.glyphs = Array.from(
      { length: width / 10 },
      (_, index) => new LayoutElement(this, "glyph", index),
    );
    this.slots = new Map(
      this.glyphs.map((_, index) => [
        index,
        new LayoutElement(this, "slot", index) as unknown as HTMLSpanElement,
      ]),
    );
  }
}

test("width compensation stays in layout when the compositor samples ahead", () => {
  for (const alignment of ["center", "right"] as const) {
    const scene = new LayoutScene(alignment);
    scene.commit(10);
    const from = scene.root.getBoundingClientRect();
    scene.commit(20);
    const to = scene.root.getBoundingClientRect();
    const morph = animateGustRootWidth({
      root: scene.root as unknown as HTMLSpanElement,
      from,
      to,
      duration: 200,
      outgoing: scene.exit as unknown as HTMLSpanElement,
    });
    // Safari's rendered transform can advance independently of main-thread width layout.
    // The horizontal anchor must not depend on the compositor sampling the same instant.
    scene.compositorAdvance = 32;
    for (let time = 0; time <= 200; time += 10) {
      scene.time = time;
      scene.glyphs.forEach((glyph, index) =>
        expect(glyph.getBoundingClientRect().left).toBeCloseTo(to.left + index * 10, 6),
      );
      expect(scene.exit.getBoundingClientRect().left).toBeCloseTo(from.left, 6);
    }
    morph.cancel();
  }
});

test("a CSS width override does not introduce compensating horizontal movement", () => {
  const scene = new LayoutScene("right");
  scene.widthOverride = true;
  scene.commit(10);
  const from = scene.root.getBoundingClientRect();
  scene.commit(20);
  const to = scene.root.getBoundingClientRect();
  const morph = animateGustRootWidth({
    root: scene.root as unknown as HTMLSpanElement,
    from,
    to,
    duration: 120,
    outgoing: scene.exit as unknown as HTMLSpanElement,
  });
  for (let frame = 0; frame <= 20; frame += 1) {
    scene.time = (frame / 20) * 120;
    scene.glyphs.forEach((glyph, index) =>
      expect(glyph.getBoundingClientRect().left).toBeCloseTo(to.left + index * 10, 6),
    );
    expect(scene.exit.getBoundingClientRect().left).toBeCloseTo(from.left, 6);
  }
  expect(scene.glyphs.every((glyph) => glyph.effects.length === 0)).toBe(true);
  morph.cancel();
});

function directionalFrames(angle: number) {
  const config = resolveGustConfig({
    blur: false,
    duration: 440,
    exitDuration: 400,
    enterAngle: angle,
    exitAngle: angle,
    entranceOvershoot: 12,
    entranceHeight: 90,
    entranceScale: 1,
    exitBlur: 0,
    exitHeight: 90,
    exitScale: 1,
    scale: false,
    stagger: 0,
  });
  return { enter: buildEnterKeyframes(config), exit: buildExitKeyframes(config) };
}

for (const alignment of ["left", "center", "right"] as const) {
  describe(`${alignment}-aligned vertical transitions`, () => {
    for (const [fromWidth, toWidth] of [
      [10, 20],
      [20, 30],
      [30, 20],
      [20, 10],
    ]) {
      for (const angle of [-90, 90])
        test(`${fromWidth / 10} to ${toWidth / 10} digits at ${angle}° keep viewport x fixed`, () => {
          const scene = new LayoutScene(alignment);
          scene.commit(fromWidth);
          const from = scene.root.getBoundingClientRect();
          scene.commit(toWidth);
          const to = scene.root.getBoundingClientRect();
          const expected = scene.glyphs.map((glyph) => glyph.getBoundingClientRect().left);
          const morph = animateGustRootWidth({
            root: scene.root as unknown as HTMLSpanElement,
            from,
            to,
            duration: 260,
            outgoing: scene.exit as unknown as HTMLSpanElement,
          });
          const { enter, exit } = directionalFrames(angle);
          scene.glyphs.forEach((glyph) =>
            glyph.animate(enter.keyframes, { duration: enter.duration, easing: "linear" }),
          );
          scene.exit.animate(exit.keyframes, { duration: exit.duration, easing: "linear" });
          const times = [
            ...enter.keyframes.map((frame) => Number(frame.offset) * enter.duration),
            ...exit.keyframes.map((frame) => Number(frame.offset) * exit.duration),
          ].sort((a, b) => a - b);
          let settled = false;
          for (const time of times) {
            scene.time = time;
            if (time >= 260 && !settled) {
              morph.cancel();
              settled = true;
            }
            scene.glyphs.forEach((glyph, index) => {
              expect(glyph.getBoundingClientRect().left).toBeCloseTo(expected[index], 6);
            });
            expect(scene.exit.getBoundingClientRect().left).toBeCloseTo(from.left, 6);
          }
          morph.cancel();
          scene.glyphs.forEach((glyph, index) =>
            expect(glyph.getBoundingClientRect().left).toBeCloseTo(expected[index], 6),
          );
        });
    }
  });
}

test("interrupting a width morph preserves live width and outgoing glyph coordinates", () => {
  const scene = new LayoutScene("right");
  scene.commit(10);
  const firstFrom = scene.root.getBoundingClientRect();
  scene.commit(20);
  const first = animateGustRootWidth({
    root: scene.root as unknown as HTMLSpanElement,
    from: firstFrom,
    to: scene.root.getBoundingClientRect(),
    duration: 260,
  });
  scene.time = 65;
  const live = scene.root.getBoundingClientRect();
  const glyphLefts = scene.glyphs.map((glyph) => glyph.getBoundingClientRect().left);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      getComputedStyle: (element: LayoutElement) => ({
        color: "rgb(12, 34, 56)",
        left: `${element.value("left", 0)}px`,
        translate: `${element.value("translate", 0)}px 0px`,
      }),
    },
  });
  let measures;
  try {
    measures = measureGustCharacterSlots(scene.root as unknown as HTMLSpanElement, scene.slots);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
  for (const [index, measure] of measures) {
    expect(live.left + measure.x).toBeCloseTo(glyphLefts[index], 6);
    expect(measure.color).toBe("rgb(12, 34, 56)");
  }
  scene.commit(30);
  first.cancel();
  const target = scene.root.getBoundingClientRect();
  const second = animateGustRootWidth({
    root: scene.root as unknown as HTMLSpanElement,
    from: live,
    to: target,
    duration: 260,
    outgoing: scene.exit as unknown as HTMLSpanElement,
    exitAnchor: live.left,
  });
  expect(scene.root.getBoundingClientRect().width).toBeCloseTo(live.width, 6);
  for (let frame = 0; frame <= 40; frame += 1) {
    scene.time = 65 + (frame / 40) * 260;
    scene.glyphs.forEach((glyph, index) =>
      expect(glyph.getBoundingClientRect().left).toBeCloseTo(target.left + index * 10, 6),
    );
    for (const [index, measure] of measures) {
      expect(scene.exit.getBoundingClientRect().left + measure.x).toBeCloseTo(glyphLefts[index], 6);
    }
  }
  second.cancel();
  for (const [index, measure] of measures)
    expect(scene.exit.getBoundingClientRect().left + measure.x).toBeCloseTo(glyphLefts[index], 6);
});

// A scaled or zoomed ancestor scales what getBoundingClientRect reports, but Gust writes widths
// and offsets in the root's own pixels. The same layout must measure the same at any scale.
test("measurements stay in the root's own pixels under a scaled ancestor", () => {
  const view = {
    getComputedStyle: (element: { css: Record<string, string> }) => element.css,
  };
  const box = (scale: number, x: number, y: number, width: number, height: number) => ({
    css: {
      boxSizing: "border-box",
      color: "rgb(1, 2, 3)",
      height: `${height}px`,
      translate: "none",
      width: `${width}px`,
    },
    getBoundingClientRect: () => ({
      height: height * scale,
      left: 300 + x * scale,
      top: 120 + y * scale,
      width: width * scale,
    }),
    isConnected: true,
    ownerDocument: { defaultView: view },
    querySelector: () => null,
  });
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: view });
  try {
    for (const scale of [0.8, 1, 2.5]) {
      const root = box(scale, 0, 0, 42.5, 20) as unknown as HTMLSpanElement;
      const slots = new Map(
        [0, 1, 2].map((index) => [
          index,
          box(scale, 3 + index * 12.25, 1.5, 12.25, 18) as unknown as HTMLSpanElement,
        ]),
      );
      const rect = measureElementRect(root);
      expect(rect.width).toBeCloseTo(42.5, 6);
      expect(rect.height).toBeCloseTo(20, 6);
      expect(rect.scale).toBeCloseTo(scale, 6);
      for (const [index, measure] of measureGustCharacterSlots(root, slots)) {
        expect(measure.x).toBeCloseTo(3 + index * 12.25, 6);
        expect(measure.y).toBeCloseTo(1.5, 6);
        expect(measure.width).toBeCloseTo(12.25, 6);
        expect(measure.height).toBeCloseTo(18, 6);
      }
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

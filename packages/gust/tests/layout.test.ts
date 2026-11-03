import { expect, mock, test } from "bun:test";

import { animateGustLayout } from "../src/hooks";
import { measureElementRect, measureGustCharacterSlots } from "../src/measure";

const timing = { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" };

function slot(left: number) {
  const glyph = {} as Element;
  const effect = { onfinish: (() => {}) as (() => void) | null, cancel: mock(() => {}) };
  return {
    glyph,
    effect,
    querySelector: () => glyph,
    getBoundingClientRect: mock(() => ({ left })),
    animate: mock(
      (_frames: Keyframe[], _options: KeyframeAnimationOptions) => effect as unknown as Animation,
    ),
  };
}

function root(slots: ReturnType<typeof slot>[]) {
  return {
    querySelectorAll: () => slots,
    animate: () => {
      throw new Error("Layout must not animate the root");
    },
  } as unknown as HTMLSpanElement;
}

test("retained glyphs FLIP from their shown position in scale-normalized pixels", () => {
  for (const scale of [0.8, 1, 2.5]) {
    for (const offset of [-12, 18]) {
      const retained = slot(100 * scale);
      const layout = animateGustLayout({
        root: root([retained]),
        to: { left: 80, scale },
        ...timing,
        carried: new Map([[retained.glyph, 100 + offset]]),
      });
      expect(retained.animate).toHaveBeenCalledTimes(1);
      expect(retained.animate).toHaveBeenCalledWith(
        [{ transform: `translateX(${offset}px)` }, { transform: "translateX(0px)" }],
        { ...timing, fill: "both" },
      );
      expect(layout.animation).toBe(retained.effect as unknown as Animation);
      expect(retained.getBoundingClientRect).toHaveBeenCalledTimes(1);
      layout.cancel();
      expect(retained.getBoundingClientRect).toHaveBeenCalledTimes(1);
    }
  }
});

test("incoming and unmoved glyphs get no horizontal animation", () => {
  const incoming = slot(10);
  const unmoved = slot(20);
  const negligible = slot(30);
  const layout = animateGustLayout({
    root: root([incoming, unmoved, negligible]),
    to: { left: 0, scale: 1 },
    ...timing,
    carried: new Map([
      [unmoved.glyph, 20],
      [negligible.glyph, 30.0005],
    ]),
  });
  expect(layout.animation).toBeUndefined();
  for (const item of [incoming, unmoved, negligible]) expect(item.animate).not.toHaveBeenCalled();
  expect(incoming.getBoundingClientRect).not.toHaveBeenCalled();
  expect(() => layout.cancel()).not.toThrow();
});

test("exit batches are anchored statically even when there are no retained glyphs", () => {
  const exits = [120, 165].map((left) => ({
    left,
    element: { style: { left: "" } } as unknown as HTMLSpanElement,
  }));
  const layout = animateGustLayout({
    root: root([]),
    to: { left: 140, scale: 2 },
    ...timing,
    exits,
    carried: new Map(),
  });
  expect(layout.animation).toBeUndefined();
  expect(exits.map(({ element }) => Number.parseFloat(element.style.left))).toEqual([-20, 25]);
  layout.cancel();
  expect(exits.map(({ element }) => Number.parseFloat(element.style.left))).toEqual([-20, 25]);
});

test("cancel clears finish handlers and cancels every retained-slot effect", () => {
  const slots = [slot(40), slot(60)];
  const layout = animateGustLayout({
    root: root(slots),
    to: { left: 0, scale: 1 },
    ...timing,
    carried: new Map(slots.map((item) => [item.glyph, 80])),
  });
  expect(layout.animation).toBe(slots[0].effect as unknown as Animation);
  layout.cancel();
  for (const item of slots) {
    expect(item.animate).toHaveBeenCalledTimes(1);
    expect(item.effect.onfinish).toBeNull();
    expect(item.effect.cancel).toHaveBeenCalledTimes(1);
    expect(item.getBoundingClientRect).toHaveBeenCalledTimes(1);
  }
});

test("root and character measurements stay in local pixels under a scaled ancestor", () => {
  const view = { getComputedStyle: (element: { css: Record<string, string> }) => element.css };
  const box = (scale: number, x: number, y: number, width: number, height: number) =>
    ({
      css: {
        boxSizing: "border-box",
        color: "rgb(1, 2, 3)",
        height: `${height}px`,
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
    }) as unknown as HTMLSpanElement;
  for (const scale of [0.8, 1, 2.5]) {
    const element = box(scale, 0, 0, 42.5, 20);
    const slots = new Map(
      [0, 1, 2].map((index) => [index, box(scale, 3 + index * 12.25, 1.5, 12.25, 18)]),
    );
    const rect = measureElementRect(element);
    expect(rect.left).toBeCloseTo(300 / scale, 6);
    expect(rect.width).toBeCloseTo(42.5, 6);
    expect(rect.height).toBeCloseTo(20, 6);
    expect(rect.scale).toBeCloseTo(scale, 6);
    const measures = measureGustCharacterSlots(element, slots);
    expect(measures.size).toBe(3);
    for (const [index, measure] of measures) {
      expect(measure.x).toBeCloseTo(3 + index * 12.25, 6);
      expect(measure.y).toBeCloseTo(1.5, 6);
      expect(measure.width).toBeCloseTo(12.25, 6);
      expect(measure.height).toBeCloseTo(18, 6);
      expect(measure.color).toBe("rgb(1, 2, 3)");
    }
  }
});

import { expect, test } from "bun:test";

import { focusCamera, layoutGrid, springStep, STAGE_SPRING } from "./demo-carousel-stage";

const desktop = { height: 900, width: 1440 };
const card = { height: 288, width: 320 };
const wide = { height: 288, width: 560 };
const order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const sizes = [card, card, wide, { height: 288, width: 360 }, card, card, card, card, card];

// Twice the reference recording's pace: half way after about 70ms and within 2% by 250ms.
test("the spring keeps its pace and settles without overshoot", () => {
  let value = 0;
  let velocity = 0;
  let peak = 0;
  for (let frame = 1; frame <= 30; frame += 1) {
    [value, velocity] = springStep(value, velocity, 1, 1 / 120, STAGE_SPRING);
    peak = Math.max(peak, value);
    if (frame === 8) expect(value).toBeCloseTo(0.5, 1);
    if (frame === 24) expect(value).toBeGreaterThan(0.95);
  }
  expect(peak).toBeLessThanOrEqual(1);
  expect(value).toBeGreaterThan(0.98);
});

test("a large frame step lands where small steps do", () => {
  let small: readonly [number, number] = [0, 0];
  for (let frame = 0; frame < 8; frame += 1) small = springStep(small[0], small[1], 100, 0.01);
  const large = springStep(0, 0, 100, 0.08);
  expect(large[0]).toBeCloseTo(small[0], 6);
  expect(large[1]).toBeCloseTo(small[1], 6);
});

test("nine cards fold into three even rows that fit the screen", () => {
  const { placements, scale } = layoutGrid({ frame: desktop, gap: 16, order, sizes });
  const rows = new Set(placements.map(({ y }) => Math.round(y)));
  expect(rows.size).toBe(3);
  for (const [index, placement] of placements.entries()) {
    expect(placement.x).toBeGreaterThanOrEqual(0);
    expect(placement.x + sizes[index]!.width * scale).toBeLessThanOrEqual(desktop.width);
    expect(placement.y + sizes[index]!.height * scale).toBeLessThanOrEqual(desktop.height);
  }
});

test("rows keep the strip's reading order", () => {
  const strip = [4, 5, 6, 7, 8, 0, 1, 2, 3];
  const { placements } = layoutGrid({ frame: desktop, gap: 16, order: strip, sizes });
  const reading = [...strip].sort(
    (a, b) => placements[a]!.y - placements[b]!.y || placements[a]!.x - placements[b]!.x,
  );
  expect(reading).toEqual(strip);
});

test("a narrow screen leaves its short row at the bottom", () => {
  const phone = { height: 812, width: 375 };
  const { placements } = layoutGrid({
    frame: phone,
    gap: 16,
    order,
    sizes: order.map(() => card),
  });
  const counts = new Map<number, number>();
  for (const { y } of placements) counts.set(Math.round(y), (counts.get(Math.round(y)) ?? 0) + 1);
  const perRow = [...counts.entries()].sort(([a], [b]) => a - b).map(([, count]) => count);
  expect(perRow.at(-1)).toBe(Math.min(...perRow));
});

test("focus centres the card and fits it inside the screen", () => {
  const { placements, scale } = layoutGrid({ frame: desktop, gap: 16, order, sizes });
  const camera = focusCamera(placements[2]!, wide, desktop);
  const shown = wide.width * scale * camera.zoom;
  expect(shown).toBeLessThanOrEqual(desktop.width);
  expect(wide.height * scale * camera.zoom).toBeLessThanOrEqual(desktop.height);
  expect(camera.x).toBeCloseTo(placements[2]!.x + (wide.width * scale) / 2, 6);
});

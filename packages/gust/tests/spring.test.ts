import { expect, test } from "bun:test";
import { spring } from "motion";
import { resolveMotionOptions } from "../src/config";
import { buildEnterKeyframes, buildExitKeyframes } from "../src/keyframes";

function scale(frame: Keyframe) {
  return Number(String(frame.transform).match(/scale\(([^)]+)\)/)?.[1]);
}
function y(frame: Keyframe) {
  return Number(String(frame.transform).match(/, ([^e]+)em\)/)?.[1]);
}
function blur(frame: Keyframe) {
  return Number(String(frame.filter).match(/blur\(([\d.e+-]+)(?:px|em)\)/)?.[1]);
}

test("ordinary spring starts growing immediately and reaches explicit start, peak, and settle targets", () => {
  const config = resolveMotionOptions({
    duration: 440,
    exitDuration: 360,
    entranceHeight: 90,
    exitHeight: 120,
    entranceStartScale: 0.6,
    entranceScale: 1.15,
    exitScale: 0.4,
    entranceOvershoot: 10,
    entranceBlur: 2,
    exitBlur: 4,
  });
  const enter = buildEnterKeyframes(config);
  const exit = buildExitKeyframes(config);
  expect(enter.duration).toBe(440);
  expect(exit.duration).toBe(360);
  expect(y(enter.keyframes[0])).toBe(0.9);
  expect(scale(enter.keyframes[0])).toBe(0.6);
  expect(scale(enter.keyframes[1])).toBeGreaterThan(0.6);
  expect(blur(enter.keyframes[0])).toBe(2);
  expect(Math.max(...enter.keyframes.map(scale))).toBeCloseTo(1.15, 8);
  expect(Math.min(...enter.keyframes.map(y))).toBeCloseTo(-0.1, 6);
  expect(y(enter.keyframes.at(-1)!)).toBe(0);
  expect(scale(enter.keyframes.at(-1)!)).toBe(1);
  expect(y(exit.keyframes.at(-1)!)).toBe(-1.2);
  expect(scale(exit.keyframes.at(-1)!)).toBeCloseTo(0.4);
  expect(blur(exit.keyframes.at(-1)!)).toBe(4);
});

test("spring scale and travel peak and return together on Motion's sampled spring", () => {
  const config = resolveMotionOptions({
    entranceHeight: 90,
    entranceStartScale: 0.6,
    entranceScale: 1.15,
    entranceOvershoot: 10,
  });
  const frames = buildEnterKeyframes(config).keyframes;
  const peak = frames.reduce((best, frame) => (y(frame) < y(best) ? frame : best));
  const generator = spring({ keyframes: [0, 1], duration: 440, bounce: 0.25 });
  const values = frames.map((frame) => generator.next(Number(frame.offset) * 440).value);
  const springPeak = Math.max(...values);
  expect(springPeak).toBeGreaterThan(1);
  expect(peak.offset).toBe(frames[values.indexOf(springPeak)].offset);
  for (const [index, frame] of frames.entries()) {
    const arriving = Number(frame.offset) <= Number(peak.offset);
    const phase = arriving
      ? values[index] / springPeak
      : (springPeak - values[index]) / (springPeak - 1);
    expect(y(frame)).toBeCloseTo(arriving ? 0.9 - phase : -0.1 + 0.1 * phase, 5);
    expect(scale(frame)).toBeCloseTo(arriving ? 0.6 + 0.55 * phase : 1.15 - 0.15 * phase, 5);
  }
});

test("spring bounce changes the path while the non-spring peak point does not", () => {
  const frames = (springBounce: number, entranceScalePeak: number) =>
    buildEnterKeyframes(resolveMotionOptions({ springBounce, entranceScalePeak }));
  expect(frames(0.25, 0.2)).toEqual(frames(0.25, 0.99));
  expect(frames(0.1, 0.99)).not.toEqual(frames(0.6, 0.99));
  for (const bounce of [0.1, 0.25, 0.6, 0.8]) {
    const motion = frames(bounce, 0.99);
    expect(scale(motion.keyframes.at(-1)!)).toBe(1);
    expect(y(motion.keyframes.at(-1)!)).toBe(0);
    expect(JSON.stringify(motion)).not.toMatch(/NaN|Infinity/);
  }
});

test("spring visibility and blur keep progressing through the return rather than finishing at the peak", () => {
  const frames = buildEnterKeyframes(
    resolveMotionOptions({ entranceBlur: 2, entranceOpacity: 0.2 }),
  ).keyframes;
  const peakIndex = frames.indexOf(
    frames.reduce((best, frame) => (y(frame) < y(best) ? frame : best)),
  );
  expect(peakIndex).toBeGreaterThan(0);
  expect(peakIndex).toBeLessThan(frames.length - 1);
  expect(Number(frames[peakIndex].opacity)).toBeLessThan(1);
  expect(blur(frames[peakIndex])).toBeGreaterThan(0);
  expect(Number(frames.at(-2)!.opacity)).toBeLessThan(1);
  expect(blur(frames.at(-2)!)).toBeGreaterThan(0);
  for (const [index, frame] of frames.entries()) {
    const visibility = (Number(frame.opacity) - 0.2) / 0.8;
    expect(blur(frame)).toBeCloseTo(2 * (1 - visibility), 8);
    expect(Number(frame.opacity)).toBeGreaterThanOrEqual(0.2);
    expect(Number(frame.opacity)).toBeLessThanOrEqual(1);
    if (index) {
      expect(Number(frame.opacity)).toBeGreaterThanOrEqual(Number(frames[index - 1].opacity));
      expect(blur(frame)).toBeLessThanOrEqual(blur(frames[index - 1]));
    }
  }
  expect(frames.at(-1)?.opacity).toBe(1);
  expect(blur(frames.at(-1)!)).toBe(0);
});

test("all exit properties follow the authored exit curve over its full duration", () => {
  const frames = buildExitKeyframes(
    resolveMotionOptions({
      exitDuration: 360,
      exitEasing: "linear",
      exitHeight: 90,
      exitScale: 0.4,
      exitOpacity: 0.2,
      exitBlur: 4,
    }),
  ).keyframes;
  for (const frame of frames) {
    const progress = Number(frame.offset);
    expect(Number(frame.opacity)).toBeCloseTo(1 - 0.8 * progress, 8);
    expect(blur(frame)).toBeCloseTo(4 * progress, 8);
    expect(y(frame)).toBeCloseTo(-0.9 * progress, 5);
    expect(scale(frame)).toBeCloseTo(1 - 0.6 * progress, 8);
  }
});

for (const enterEasing of ["spring", "linear", [0.2, 1.4, 0.4, 1], [0.2, -0.4, 0.8, 1]] as const) {
  test(`disabled effects and zero durations stay finite and settle with ${JSON.stringify(enterEasing)}`, () => {
    const config = resolveMotionOptions({
      enterEasing,
      duration: 0,
      exitDuration: 0,
      scale: false,
      blur: false,
    });
    for (const motion of [buildEnterKeyframes(config), buildExitKeyframes(config)]) {
      expect(motion.duration).toBe(0);
      for (const frame of motion.keyframes) {
        expect(scale(frame)).toBe(1);
        expect(frame.filter).toBeUndefined();
        expect(String(frame.transform)).not.toMatch(/NaN|Infinity/);
        expect(Number.isFinite(Number(frame.offset))).toBe(true);
        expect(Number(frame.opacity)).toBeGreaterThanOrEqual(0);
        expect(Number(frame.opacity)).toBeLessThanOrEqual(1);
      }
    }
    expect(y(buildEnterKeyframes(config).keyframes.at(-1)!)).toBe(0);
    expect(buildEnterKeyframes(config).keyframes.at(-1)?.opacity).toBe(1);
    expect(buildExitKeyframes(config).keyframes.at(-1)?.opacity).toBe(0);
  });
}

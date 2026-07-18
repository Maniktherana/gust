import { describe, expect, test } from "bun:test";

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_BLUR_CAP,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  MAX_LAYOUT_DURATION_MS,
  resolveGustConfig,
  resolveLayoutDuration,
} from "../src/config";
import {
  buildEnterKeyframes,
  buildExitKeyframes,
  characterTransitionWindow,
  lastCharacterStartDelay,
} from "../src/keyframes";

function resolve(overrides: Partial<Parameters<typeof resolveGustConfig>[0]> = {}) {
  return resolveGustConfig({
    blur: true,
    duration: DEFAULT_DURATION_MS,
    enterAngle: DEFAULT_ENTER_ANGLE,
    entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
    entranceScale: DEFAULT_ENTRANCE_SCALE,
    exitDuration: DEFAULT_EXIT_DURATION_MS,
    exitAngle: DEFAULT_EXIT_ANGLE,
    exitBlurCap: DEFAULT_EXIT_BLUR_CAP,
    exitHeight: DEFAULT_EXIT_HEIGHT,
    exitScale: DEFAULT_EXIT_SCALE,
    scale: true,
    stagger: DEFAULT_STAGGER_MS,
    ...overrides,
  });
}

describe("motion configuration", () => {
  test("normalizes unsafe numeric input", () => {
    expect(
      resolve({
        duration: -10,
        entranceScale: 10,
        exitBlurCap: Number.NaN,
        exitScale: 10,
        stagger: Number.NaN,
      }),
    ).toMatchObject({
      duration: 0,
      entranceScale: 2,
      exitBlurCap: DEFAULT_EXIT_BLUR_CAP,
      exitScale: 1.5,
      enterStagger: DEFAULT_STAGGER_MS,
    });
  });

  test("wraps directional angles", () => {
    expect(resolve({ enterAngle: 450, exitAngle: -450 })).toMatchObject({
      enterAngle: 90,
      exitAngle: -90,
    });
  });

  test("uses grapheme counts for stagger windows", () => {
    expect(characterTransitionWindow("A👨‍👩‍👧‍👦B", 100, 20)).toBe(140);
    expect(lastCharacterStartDelay("A👨‍👩‍👧‍👦B", 20, 1)).toBe(20);
  });

  test("keeps layout settling independent from long character motion", () => {
    expect(resolveLayoutDuration(120)).toBe(120);
    expect(resolveLayoutDuration(1_200)).toBe(MAX_LAYOUT_DURATION_MS);
  });

  test("finishes opacity reveal before entrance scale grows", () => {
    const entrance = buildEnterKeyframes(resolve()).keyframes;
    const firstGrowingFrame = entrance.find((frame) => {
      const scale = String(frame.transform).match(/scale\(([^)]+)\)/)?.[1];

      return Number(scale) > 1.001;
    });

    expect(firstGrowingFrame).toBeDefined();
    expect(firstGrowingFrame?.opacity).toBe(1);
    expect(entrance.every((frame) => !("filter" in frame))).toBe(true);
  });

  test("caps exit blur at the configured pixel value", () => {
    const exit = buildExitKeyframes(resolve({ exitBlurCap: 6 })).keyframes;
    const unblurredExit = buildExitKeyframes(resolve({ blur: false })).keyframes;

    expect(exit.at(-1)?.filter).toBe("blur(6px)");
    expect(unblurredExit.every((frame) => !("filter" in frame))).toBe(true);
  });
});

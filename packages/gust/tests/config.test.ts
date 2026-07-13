import { describe, expect, test } from "bun:test";

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
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
    entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
    entranceScale: DEFAULT_ENTRANCE_SCALE,
    exitDuration: DEFAULT_EXIT_DURATION_MS,
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
      resolve({ duration: -10, entranceScale: 10, exitScale: 10, stagger: Number.NaN }),
    ).toMatchObject({
      duration: 0,
      entranceScale: 2,
      exitScale: 1.5,
      enterStagger: DEFAULT_STAGGER_MS,
    });
  });

  test("uses grapheme counts for stagger windows", () => {
    expect(characterTransitionWindow("A👨‍👩‍👧‍👦B", 100, 20)).toBe(140);
    expect(lastCharacterStartDelay("A👨‍👩‍👧‍👦B", 20, 1)).toBe(20);
  });

  test("reduced motion removes transforms, filters, and long timings", () => {
    const enter = buildEnterKeyframes(resolve(), true);
    const exit = buildExitKeyframes(resolve(), true);

    expect(enter.duration).toBeLessThanOrEqual(180);
    expect(exit.duration).toBeLessThanOrEqual(180);
    expect(enter.keyframes.every(({ transform, filter }) => !transform && !filter)).toBe(true);
    expect(exit.keyframes.every(({ transform, filter }) => !transform && !filter)).toBe(true);
  });
});

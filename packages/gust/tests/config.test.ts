import { describe, expect, test } from "bun:test";

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
} from "../src/config";
import { characterTransitionWindow, lastCharacterStartDelay } from "../src/keyframes";

function resolve(overrides: Partial<Parameters<typeof resolveGustConfig>[0]> = {}) {
  return resolveGustConfig({
    blur: true,
    duration: DEFAULT_DURATION_MS,
    enterAngle: DEFAULT_ENTER_ANGLE,
    entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
    entranceScale: DEFAULT_ENTRANCE_SCALE,
    exitDuration: DEFAULT_EXIT_DURATION_MS,
    exitAngle: DEFAULT_EXIT_ANGLE,
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
});

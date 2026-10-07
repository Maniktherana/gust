import { describe, expect, test } from "bun:test";
import defaultKeyframes from "./fixtures/default-keyframes.json";

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_BLUR,
  DEFAULT_ENTRANCE_OVERSHOOT,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_BLUR,
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
    entranceOvershoot: DEFAULT_ENTRANCE_OVERSHOOT,
    entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
    entranceScale: DEFAULT_ENTRANCE_SCALE,
    exitDuration: DEFAULT_EXIT_DURATION_MS,
    exitAngle: DEFAULT_EXIT_ANGLE,
    exitBlur: DEFAULT_EXIT_BLUR,
    exitHeight: DEFAULT_EXIT_HEIGHT,
    exitScale: DEFAULT_EXIT_SCALE,
    scale: true,
    stagger: DEFAULT_STAGGER_MS,
    ...overrides,
  });
}

describe("motion configuration", () => {
  test("preserves the complete default keyframes across the motion prop renaming", () => {
    const config = resolve();

    expect(config).toMatchObject({
      entranceHeight: 90,
      entranceOvershoot: 12,
      entranceBlur: 0,
      exitHeight: 90,
      exitBlur: 4,
    });
    expect(buildEnterKeyframes(config)).toEqual(defaultKeyframes.enter);
    expect(buildExitKeyframes(config)).toEqual(defaultKeyframes.exit);
  });

  test("uses deprecated offset and blur aliases only when canonical props are omitted", () => {
    const aliased = resolve({
      entranceHeight: undefined,
      entranceOffset: 120,
      entranceBlur: undefined,
      entranceBlurCap: 3,
      exitBlur: undefined,
      exitBlurCap: 6,
    });
    const canonical = resolve({ entranceHeight: 120, entranceBlur: 3, exitBlur: 6 });

    expect(aliased).toEqual(canonical);
    expect(buildEnterKeyframes(aliased)).toEqual(buildEnterKeyframes(canonical));
    expect(buildExitKeyframes(aliased)).toEqual(buildExitKeyframes(canonical));
    expect(
      resolve({
        entranceHeight: 0,
        entranceOffset: 120,
        entranceBlur: 0,
        entranceBlurCap: 3,
        exitBlur: 0,
        exitBlurCap: 6,
      }),
    ).toMatchObject({ entranceHeight: 0, entranceBlur: 0, exitBlur: 0 });
  });

  test("clamps travel and overshoot independently without adding exit bounce", () => {
    expect(resolve({ entranceHeight: -90, entranceOvershoot: -12, exitHeight: -90 })).toMatchObject(
      { entranceHeight: 0, entranceOvershoot: 0, exitHeight: 0 },
    );
    expect(
      resolve({
        entranceHeight: Number.POSITIVE_INFINITY,
        entranceOvershoot: Number.NaN,
        exitHeight: Number.NaN,
      }),
    ).toMatchObject({
      entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
      entranceOvershoot: DEFAULT_ENTRANCE_OVERSHOOT,
      exitHeight: DEFAULT_EXIT_HEIGHT,
    });
    const noBounce = buildEnterKeyframes(resolve({ entranceOvershoot: 0 })).keyframes;
    const bounced = buildEnterKeyframes(resolve({ entranceOvershoot: 12 })).keyframes;
    const distance = (frame: Keyframe) =>
      Number(String(frame.transform).match(/translate\(0em, ([^e]+)em\)/)?.[1]);

    expect(noBounce.every((frame) => distance(frame) >= 0)).toBe(true);
    expect(bounced.some((frame) => distance(frame) < 0)).toBe(true);
    expect(bounced.at(-1)?.transform).toContain("translate(0em, 0em)");
  });

  test("renders configured entrance scales below one", () => {
    const config = resolve({ entranceScale: 0.7 });
    expect(config.entranceScale).toBe(0.7);

    const scales = buildEnterKeyframes(config).keyframes.map((frame) =>
      Number(String(frame.transform).match(/scale\(([^)]+)\)/)?.[1]),
    );
    expect(Math.min(...scales)).toBeLessThan(0.75);
    expect(scales.at(-1)).toBe(1);
  });

  test("normalizes unsafe numeric input", () => {
    expect(
      resolve({
        duration: -10,
        entranceHeight: Number.NaN,
        entranceScale: 10,
        exitBlur: Number.NaN,
        exitScale: 10,
        stagger: Number.NaN,
      }),
    ).toMatchObject({
      duration: 0,
      entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
      entranceScale: 2,
      exitBlur: DEFAULT_EXIT_BLUR,
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

  test("uses the configured entrance height as the starting travel distance", () => {
    const entrance = buildEnterKeyframes(resolve({ entranceHeight: 120 })).keyframes;

    expect(entrance[0]?.transform).toContain("translate(0em, 1.2em)");
  });

  test("caps exit blur at the configured pixel value", () => {
    const exit = buildExitKeyframes(resolve({ exitBlur: 6 })).keyframes;
    const unblurredExit = buildExitKeyframes(resolve({ blur: false })).keyframes;

    expect(exit.at(-1)?.filter).toBe("blur(6px)");
    expect(unblurredExit.every((frame) => !("filter" in frame))).toBe(true);
  });

  test("keeps entrance blur disabled by default without changing other keyframe tracks", () => {
    const config = resolve();
    const entrance = buildEnterKeyframes(config);

    expect(DEFAULT_ENTRANCE_BLUR).toBe(0);
    expect(config.entranceBlur).toBe(0);
    expect(entrance.keyframes.every((frame) => !("filter" in frame))).toBe(true);
    expect(buildEnterKeyframes(resolve({ entranceBlur: 0 }))).toEqual(entrance);

    const blurred = buildEnterKeyframes(resolve({ entranceBlur: 4 }));
    expect(blurred.duration).toBe(entrance.duration);
    expect(blurred.keyframes.map(({ filter: _filter, ...frame }) => frame)).toEqual(
      entrance.keyframes,
    );
  });

  test("sharpens arriving characters from the configured blur cap", () => {
    const entrance = buildEnterKeyframes(resolve({ entranceBlur: 4 })).keyframes;
    const blurs = entrance.map((frame) =>
      Number(String(frame.filter).match(/blur\(([^p]+)px\)/)?.[1]),
    );

    expect(entrance[0].filter).toBe("blur(4px)");
    expect(entrance.at(-1)?.filter).toBe("blur(0px)");
    expect(
      blurs.every(
        (blur, index) =>
          Number.isFinite(blur) && blur >= 0 && (index === 0 || blur <= blurs[index - 1]),
      ),
    ).toBe(true);
    expect(blurs.some((blur) => blur > 0 && blur < 4)).toBe(true);
  });

  test("the blur switch disables both entrance and exit filters", () => {
    const config = resolve({ blur: false, entranceBlur: 4, exitBlur: 4 });

    expect(buildEnterKeyframes(config).keyframes.every((frame) => !("filter" in frame))).toBe(true);
    expect(buildExitKeyframes(config).keyframes.every((frame) => !("filter" in frame))).toBe(true);
  });

  test("normalizes entrance blur caps like exit blur caps", () => {
    for (const [input, expected] of [
      [-4, 0],
      [Number.NaN, 0],
      [Number.POSITIVE_INFINITY, 0],
      [Number.NEGATIVE_INFINITY, 0],
      [12.5, 12.5],
    ]) {
      expect(resolve({ entranceBlur: input }).entranceBlur).toBe(expected);
    }
  });
});

import { describe, expect, test } from "bun:test";
import defaultKeyframes from "./fixtures/default-keyframes.json";

import {
  DEFAULT_MOTION,
  DEFAULT_ENTRANCE_BLUR,
  DEFAULT_ENTRANCE_OVERSHOOT,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_EXIT_BLUR,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
  resolveMotionOptions,
  resolveLayoutDuration,
  resolveTransitionConfig,
} from "../src/config";
import {
  buildEnterKeyframes,
  buildExitKeyframes,
  characterTransitionWindow,
  lastCharacterStartDelay,
} from "../src/keyframes";

function resolve(overrides: Partial<Parameters<typeof resolveGustConfig>[0]> = {}) {
  return resolveGustConfig(overrides);
}

describe("motion configuration", () => {
  test("uses the approved default motion and its complete keyframes", () => {
    const expected: typeof DEFAULT_MOTION = {
      duration: 440,
      exitDuration: 440,
      enterDelay: 0,
      exitDelay: 0,
      stagger: 110,
      staggerMode: "bounded",
      staggerSpread: 0.3,
      enterStagger: 33,
      exitStagger: 33,
      staggerDirection: "forward",
      enterAngle: -90,
      exitAngle: -90,
      entranceHeight: 70,
      entranceOvershoot: 10,
      exitHeight: 110,
      scale: true,
      entranceStartScale: 0.6,
      entranceScale: 1.1,
      exitScale: 0.6,
      entranceScalePeak: 0.99,
      entranceOpacity: 0,
      exitOpacity: 0,
      entranceRotation: 0,
      exitRotation: 0,
      transformOrigin: "center",
      blur: true,
      entranceBlur: 0,
      exitBlur: 3,
      blurUnit: "px",
      enterEasing: "spring",
      springBounce: 0.25,
      exitEasing: [0.16, 1, 0.3, 1],
      layoutEasing: [0.175, 0.885, 0.32, 1],
      preserveMatching: true,
    };
    expect(DEFAULT_MOTION).toEqual(expected);
    expect(DEFAULT_STAGGER_MS).toBe(110);
    const { stagger: _stagger, ...resolved } = expected;
    const config = resolve();
    expect(config).toEqual({ ...resolved, enterDuration: 440, layoutDuration: undefined });
    expect(resolveMotionOptions()).toEqual(config);
    expect(resolveMotionOptions(DEFAULT_MOTION)).toEqual(config);
    expect(buildEnterKeyframes(config)).toEqual(defaultKeyframes.enter);
    expect(buildExitKeyframes(config)).toEqual(defaultKeyframes.exit);
  });

  test("bounded stagger uses each batch's count and duration without mutating authored gaps", () => {
    const config = resolve({ duration: 600, exitDuration: 200, enterStagger: 99, exitStagger: 88 });
    const batch = resolveTransitionConfig(config, 3, 2);
    expect(batch).toEqual({ ...config, enterStagger: 60, exitStagger: 30 });
    expect(config.enterStagger).toBe(99);
    expect(config.exitStagger).toBe(88);
    expect(resolveTransitionConfig(batch, 3, 2)).toEqual(batch);
    expect(resolveTransitionConfig(config, 0, 0)).toMatchObject({
      enterStagger: 0,
      exitStagger: 0,
    });
    expect(resolveTransitionConfig(config, 1, 1)).toMatchObject({
      enterStagger: 180,
      exitStagger: 60,
    });
    expect(resolveTransitionConfig(resolve(), 4, 2)).toMatchObject({
      enterStagger: 33,
      exitStagger: 66,
    });
  });

  test("stagger spread accepts zero through 150 percent and defaults nonfinite inputs", () => {
    for (const [input, expected] of [
      [-1, 0],
      [0, 0],
      [0.75, 0.75],
      [1.5, 1.5],
      [2, 1.5],
      [Number.NaN, 0.3],
      [Number.POSITIVE_INFINITY, 0.3],
      [Number.NEGATIVE_INFINITY, 0.3],
    ]) {
      const config = resolve({ staggerSpread: input, duration: 600, exitDuration: 200 });
      expect(config.staggerSpread).toBe(expected);
      expect(resolveTransitionConfig(config, 3, 2)).toMatchObject({
        enterStagger: (600 * expected) / 3,
        exitStagger: (200 * expected) / 2,
      });
    }
  });

  test("fixed mode preserves explicit gaps and returns the original config", () => {
    const config = resolve({
      staggerMode: "fixed",
      stagger: 25,
      enterStagger: 10,
      exitStagger: 40,
    });
    expect(resolveTransitionConfig(config, 100, 20)).toBe(config);
    expect(resolveTransitionConfig(config, 0, 0)).toBe(config);
    expect(config).toMatchObject({ enterStagger: 10, exitStagger: 40 });
    expect(
      resolveTransitionConfig(resolve({ staggerMode: "fixed", stagger: 25 }), 3, 2),
    ).toMatchObject({ enterStagger: 25, exitStagger: 25 });
  });

  test("bounded automatic layout ends with the last entrance including delay, or last exit when exit-only", () => {
    const config = resolve({ duration: 600, exitDuration: 200, enterDelay: 40, exitDelay: 800 });
    expect(resolveLayoutDuration(config, 3, 2)).toBe(760);
    expect(resolveLayoutDuration(resolveTransitionConfig(config, 3, 2), 3, 2)).toBe(760);
    expect(resolveLayoutDuration({ ...config, staggerDirection: "reverse" }, 3, 2)).toBe(760);
    expect(resolveLayoutDuration(config, 0, 2)).toBe(1030);
    expect(resolveLayoutDuration(config, 1, 0)).toBe(640);
    expect(resolveLayoutDuration(config, 0, 0)).toBe(600);
    expect(resolveLayoutDuration({ ...config, staggerSpread: 0 }, 3, 2)).toBe(640);
    expect(resolveLayoutDuration({ ...config, staggerSpread: 1.5 }, 3, 2)).toBe(1240);
    expect(resolveLayoutDuration({ ...config, layoutDuration: 0 }, 3, 2)).toBe(0);
    expect(resolveLayoutDuration({ ...config, layoutDuration: 700 }, 3, 2)).toBe(700);
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

  test("fixed automatic layout finishes with the last entrance, including delay and stagger", () => {
    const resolve = (options: Parameters<typeof resolveMotionOptions>[0] = {}) =>
      resolveMotionOptions({ ...options, staggerMode: "fixed" });
    expect(resolve().layoutDuration).toBeUndefined();
    expect(resolve().layoutEasing).toEqual([0.175, 0.885, 0.32, 1]);
    expect(resolve({ layoutEasing: "linear" }).layoutEasing).toBe("linear");
    expect(resolveLayoutDuration(resolve({ duration: 120 }), 1, 0)).toBe(120);
    expect(resolveLayoutDuration(resolve({ duration: 1200 }), 1, 0)).toBe(1200);
    expect(resolveLayoutDuration(resolve({ enterDelay: 30 }), 23, 5)).toBe(1196);
    expect(
      resolveLayoutDuration(resolve({ enterDelay: 30, staggerDirection: "reverse" }), 23, 5),
    ).toBe(1196);
    expect(resolveLayoutDuration(resolve({ exitDelay: 10 }), 0, 5)).toBe(582);
    expect(
      resolveLayoutDuration(
        resolve({ duration: 320, enterDelay: 40, enterStagger: 25, exitDelay: 800 }),
        3,
        1,
      ),
    ).toBe(410);
    expect(
      resolveLayoutDuration(resolve({ exitDuration: 200, exitDelay: 800, exitStagger: 10 }), 0, 3),
    ).toBe(1020);
    expect(resolveLayoutDuration(resolve({ layoutDuration: 0 }), 23, 5)).toBe(0);
    expect(resolveLayoutDuration(resolve({ layoutDuration: 700 }), 23, 5)).toBe(700);
  });

  test("reveals opacity while entrance scale grows and returns", () => {
    const entrance = buildEnterKeyframes(resolve()).keyframes;
    const firstGrowingFrame = entrance.find((frame) => {
      const scale = String(frame.transform).match(/scale\(([^)]+)\)/)?.[1];

      return Number(scale) > 1.001;
    });

    expect(firstGrowingFrame).toBeDefined();
    expect(Number(firstGrowingFrame?.opacity)).toBeGreaterThan(0);
    expect(Number(firstGrowingFrame?.opacity)).toBeLessThan(1);
    expect(Number(entrance.at(-2)?.opacity)).toBeLessThan(1);
    expect(entrance.at(-1)?.opacity).toBe(1);
    expect(entrance.every((frame) => !("filter" in frame))).toBe(true);
  });

  test("uses the configured entrance height as the starting travel distance", () => {
    const entrance = buildEnterKeyframes(resolve({ entranceHeight: 120 })).keyframes;

    expect(entrance[0]?.transform).toContain("translate(0em, 1.2em)");
  });

  test("ends exit blur at the configured pixel value", () => {
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

  test("sharpens arriving characters from the configured initial blur", () => {
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

  test("normalizes invalid entrance blur values", () => {
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

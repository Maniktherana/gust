import { describe, expect, test } from "bun:test";
import { easingToCss, resolveMotionOptions } from "../src/config";
import { cubicBezier } from "../src/easing";
import { buildEnterKeyframes, buildExitKeyframes } from "../src/keyframes";
import defaults from "./fixtures/default-keyframes.json";

describe("authoring configuration", () => {
  test("an empty motion object uses the approved default animation", () => {
    const config = resolveMotionOptions();
    expect(buildEnterKeyframes(config)).toEqual(defaults.enter);
    expect(buildExitKeyframes(config)).toEqual(defaults.exit);
  });

  test("independent delay, stagger, and layout controls do not overwrite each other", () => {
    expect(
      resolveMotionOptions({
        duration: 900,
        exitDuration: 300,
        enterDelay: 40,
        exitDelay: 80,
        stagger: 30,
        staggerMode: "fixed",
        enterStagger: 0,
        exitStagger: 10,
        layoutDuration: 700,
        layoutEasing: "linear",
        staggerDirection: "reverse",
      }),
    ).toMatchObject({
      enterDuration: 900,
      exitDuration: 300,
      enterDelay: 40,
      exitDelay: 80,
      enterStagger: 0,
      exitStagger: 10,
      layoutDuration: 700,
      layoutEasing: "linear",
      staggerDirection: "reverse",
    });
  });

  test("preserveMatching takes precedence over its published alias", () => {
    expect(resolveMotionOptions({ preservePrefix: false }).preserveMatching).toBe(false);
    expect(
      resolveMotionOptions({ preservePrefix: false, preserveMatching: true }).preserveMatching,
    ).toBe(true);
  });

  test("authors can control the full entry and exit endpoints", () => {
    const config = resolveMotionOptions({
      entranceStartScale: 0.6,
      entranceScale: 1,
      entranceScalePeak: 0.8,
      entranceOpacity: 0.2,
      entranceRotation: 2,
      exitRotation: -3,
      exitOpacity: 0.1,
      entranceBlur: 0.1,
      exitBlur: 0.2,
      blurUnit: "em",
      exitEasing: "linear",
    });
    const enter = buildEnterKeyframes(config).keyframes;
    const exit = buildExitKeyframes(config).keyframes;
    expect(enter[0].transform).toContain("scale(0.6) rotate(2deg)");
    expect(enter[0].opacity).toBe(0.2);
    expect(enter[0].filter).toBe("blur(0.1em)");
    expect(enter.at(-1)?.transform).toContain("scale(1) rotate(0deg)");
    expect(enter.at(-1)?.opacity).toBe(1);
    expect(enter.at(-1)?.filter).toBe("blur(0em)");
    expect(exit.at(-1)?.transform).toContain("rotate(-3deg)");
    expect(Number(exit.at(-1)?.opacity)).toBeCloseTo(0.1, 12);
    expect(exit.at(-1)?.filter).toBe("blur(0.2em)");
    const halfway = exit.find((frame) => frame.offset === 0.5)!;
    expect(Number(halfway.opacity)).toBeCloseTo(0.55);
    expect(halfway.filter).toBe("blur(0.1em)");
    expect(buildEnterKeyframes(config).keyframes[0].filter).toBe("blur(0.1em)");
  });

  test("linear travel still reaches the authored overshoot target before settling", () => {
    const frames = buildEnterKeyframes(
      resolveMotionOptions({
        enterEasing: "linear",
        entranceHeight: 100,
        entranceOvershoot: 40,
      }),
    ).keyframes;
    expect(frames[0].transform).toContain("translate(0em, 1em)");
    expect(frames.at(-1)?.transform).toContain("translate(0em, 0em)");
    expect(frames.some((frame) => String(frame.transform).includes("translate(0em, -0.4em)"))).toBe(
      true,
    );
  });

  test("zero-duration tracks settle and never produce nonfinite keyframes", () => {
    const config = resolveMotionOptions({
      duration: 0,
      exitDuration: 0,
      entranceScalePeak: 0.99,
      entranceBlur: 4,
    });
    expect(JSON.stringify([buildEnterKeyframes(config), buildExitKeyframes(config)])).not.toMatch(
      /NaN|Infinity/,
    );
    expect(buildEnterKeyframes(config).duration).toBe(0);
    expect(buildExitKeyframes(config).duration).toBe(0);
    expect(buildEnterKeyframes(config).keyframes.at(-1)?.transform).toBe(
      "translate(0em, 0em) scale(1)",
    );
  });

  test("disabling scale and blur overrides their individual controls", () => {
    const config = resolveMotionOptions({
      scale: false,
      blur: false,
      entranceStartScale: 0.1,
      entranceBlur: 8,
    });
    const frames = [
      ...buildEnterKeyframes(config).keyframes,
      ...buildExitKeyframes(config).keyframes,
    ];
    expect(frames.every((frame) => String(frame.transform).includes("scale(1)"))).toBe(true);
    expect(frames.every((frame) => frame.filter === undefined)).toBe(true);
  });

  test("clamps peak points and rejects invalid cubic Bézier coordinates", () => {
    expect(resolveMotionOptions({ entranceScalePeak: 0 }).entranceScalePeak).toBe(0.01);
    expect(resolveMotionOptions({ entranceScalePeak: 1 }).entranceScalePeak).toBe(0.99);
    expect(() => resolveMotionOptions({ enterEasing: [-1, 0, 1, 1] })).toThrow(RangeError);
    expect(() => resolveMotionOptions({ layoutEasing: [0, Number.NaN, 1, 1] })).toThrow(RangeError);
    expect(easingToCss([0.16, 1, 0.3, 1])).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
  });

  test("a flat-tangent curve remains finite, bounded, and monotonic", () => {
    const ease = cubicBezier(1, 0, 0, 1);
    const samples = Array.from({ length: 101 }, (_, index) => ease(index / 100));
    expect(samples[0]).toBe(0);
    expect(samples[50]).toBeCloseTo(0.5, 6);
    expect(samples[100]).toBe(1);
    expect(
      samples.every(
        (value, index) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 1 &&
          (index === 0 || value >= samples[index - 1]),
      ),
    ).toBe(true);
  });
});

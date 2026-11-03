import { describe, expect, test } from "bun:test";
import { DEFAULT_MOTION, resolveMotionOptions } from "@gust-src/config";
import {
  completeAuthorMotion,
  exportMotionConfiguration,
  motionAtPlaybackSpeed,
  motionFieldKeys,
  parseMotionConfiguration,
  sampleEnter,
  sampleExit,
  transitionTimeline,
} from "./gust-motion";

describe("author configuration", () => {
  test("exports every current control, approved defaults, and automatic layout", () => {
    const document = JSON.parse(exportMotionConfiguration({}));
    expect(document.version).toBe(1);
    expect(Object.keys(document.motion)).toHaveLength(35);
    expect(document.motion).toMatchObject({
      duration: 440,
      exitDuration: 440,
      stagger: 110,
      staggerMode: "bounded",
      staggerSpread: 0.3,
      enterAngle: -90,
      exitAngle: -90,
      entranceHeight: 70,
      exitHeight: 110,
      entranceOvershoot: 10,
      entranceStartScale: 0.6,
      entranceScale: 1.1,
      exitScale: 0.6,
      entranceBlur: 0,
      exitBlur: 3,
      preserveMatching: true,
      layoutDuration: null,
      enterStagger: 33,
      exitStagger: 33,
      entranceScalePeak: 0.99,
      enterEasing: "spring",
      springBounce: 0.25,
      exitEasing: [0.16, 1, 0.3, 1],
      layoutEasing: [0.175, 0.885, 0.32, 1],
    });
    expect(document.resolved).toMatchObject({
      duration: 440,
      enterDuration: 440,
      staggerMode: "bounded",
      staggerSpread: 0.3,
      layoutDuration: null,
      enterStagger: 33,
      exitStagger: 33,
    });
    expect(resolveMotionOptions(parseMotionConfiguration(JSON.stringify(document)))).toEqual(
      resolveMotionOptions(),
    );
  });

  test("round trips explicit zeroes, false, custom curves, fractions, and em blur", () => {
    const authored = {
      ...DEFAULT_MOTION,
      duration: 600,
      exitDuration: 360,
      enterAngle: 30,
      exitAngle: -45,
      entranceHeight: 95,
      entranceOvershoot: 17,
      exitHeight: 80,
      entranceScale: 1.15,
      exitScale: 0.45,
      layoutEasing: [0.2, 0.1, 0.6, 1] as const,
      enterDelay: 30,
      exitDelay: 80,
      stagger: 0,
      staggerMode: "fixed" as const,
      staggerSpread: 1.5,
      enterStagger: 5,
      exitStagger: 7,
      staggerDirection: "reverse" as const,
      entranceStartScale: 0,
      entranceScalePeak: 0.5,
      springBounce: 0.4,
      entranceOpacity: 0.15,
      exitOpacity: 0.25,
      entranceRotation: -35,
      exitRotation: 40,
      transformOrigin: "top" as const,
      entranceBlur: 0.25,
      exitBlur: 0.5,
      blurUnit: "em" as const,
      enterEasing: [0.2, -0.4, 0.8, 1.4] as const,
      exitEasing: "linear" as const,
      layoutDuration: 0,
      scale: false,
      preserveMatching: false,
    };
    const imported = parseMotionConfiguration(exportMotionConfiguration(authored));
    expect(imported).toMatchObject(authored);
    expect(exportMotionConfiguration(imported)).toBe(exportMotionConfiguration(authored));
  });

  test("exporting an empty motion object preserves its resolved default staggers", () => {
    const imported = parseMotionConfiguration(exportMotionConfiguration({}));
    expect(resolveMotionOptions(imported)).toEqual(resolveMotionOptions());
  });

  test("the shared default document round trips losslessly with automatic layout", () => {
    const exported = exportMotionConfiguration(DEFAULT_MOTION);
    const document = JSON.parse(exported);
    expect(document.motion).toEqual({ ...DEFAULT_MOTION, layoutDuration: null });
    expect(document.resolved.layoutDuration).toBeNull();
    expect(parseMotionConfiguration(exported)).toEqual(DEFAULT_MOTION);
    expect(exportMotionConfiguration(parseMotionConfiguration(exported))).toBe(exported);
  });

  test("auto inheritance survives a round trip instead of freezing a resolved value", () => {
    const imported = parseMotionConfiguration(
      exportMotionConfiguration({ duration: 150, stagger: 35 }),
    );
    expect(imported.layoutDuration).toBeUndefined();
    expect(imported.enterStagger).toBeUndefined();
    expect(resolveMotionOptions({ ...imported, duration: 80, stagger: 9 })).toMatchObject({
      layoutDuration: undefined,
      enterStagger: 9,
      exitStagger: 9,
    });
    expect(completeAuthorMotion(imported).layoutDuration).toBeNull();
  });

  test("round trips stagger policy without baking in a transition-specific gap", () => {
    for (const staggerMode of ["bounded", "fixed"] as const) {
      for (const staggerSpread of [0, 0.3, 1.5]) {
        const options = {
          duration: 400,
          exitDuration: 200,
          stagger: 110,
          staggerMode,
          staggerSpread,
        };
        const exported = exportMotionConfiguration(options);
        const document = JSON.parse(exported);
        const imported = parseMotionConfiguration(exported);
        expect(document.motion).toMatchObject({
          staggerMode,
          staggerSpread,
          enterStagger: null,
          exitStagger: null,
        });
        expect(document.resolved).toMatchObject({ staggerMode, staggerSpread });
        expect(imported).toMatchObject(options);
        expect(resolveMotionOptions(imported)).toEqual(resolveMotionOptions(options));
        expect(exportMotionConfiguration(imported)).toBe(exported);
        const short = transitionTimeline("", "ab", imported);
        const long = transitionTimeline("", "abcd", imported);
        expect(short.enters[1].delay).toBe(staggerMode === "bounded" ? 200 * staggerSpread : 110);
        expect(long.enters[1].delay).toBe(staggerMode === "bounded" ? 100 * staggerSpread : 110);
      }
    }
  });

  test("complete documents require both policy fields and matching resolved snapshots", () => {
    for (const key of ["staggerMode", "staggerSpread"]) {
      const missing = JSON.parse(exportMotionConfiguration({}));
      delete missing.motion[key];
      expect(() => parseMotionConfiguration(JSON.stringify(missing))).toThrow(
        `Missing motion key: ${key}`,
      );
      const altered = JSON.parse(exportMotionConfiguration({}));
      altered.resolved[key] = key === "staggerMode" ? "fixed" : 0.5;
      expect(() => parseMotionConfiguration(JSON.stringify(altered))).toThrow(
        `resolved.${key} does not match`,
      );
    }
  });

  test("accepts partial motion objects for hand authoring", () => {
    expect(
      parseMotionConfiguration(
        '{"duration":320,"exitEasing":[0.1,-2,0.9,3],"enterEasing":"spring","layoutDuration":null}',
      ),
    ).toEqual({ duration: 320, exitEasing: [0.1, -2, 0.9, 3], enterEasing: "spring" });
  });

  const invalid = [
    ["{", "Invalid JSON"],
    ["null", "JSON object"],
    ["[]", "JSON object"],
    ['{"typo":10}', "Unknown motion key"],
    ['{"__proto__":{}}', "Unknown motion key"],
    ['{"preservePrefix":true}', "Unknown motion key"],
    ['{"duration":"440"}', "finite number"],
    ['{"duration":1e999}', "finite number"],
    ['{"duration":-1}', "between"],
    ['{"entranceScale":2.1}', "between"],
    ['{"exitScale":1.6}', "between"],
    ['{"entranceOpacity":1.1}', "between"],
    ['{"entranceScalePeak":0}', "between"],
    ['{"entranceScalePeak":1}', "between"],
    ['{"springBounce":0.09}', "between"],
    ['{"springBounce":0.81}', "between"],
    ['{"springBounce":null}', "finite number"],
    ['{"entranceRotation":181}', "between"],
    ['{"blur":1}', "true or false"],
    ['{"scale":null}', "true or false"],
    ['{"blurUnit":"rem"}', "px or em"],
    ['{"transformOrigin":"left"}', "center or top or bottom"],
    ['{"staggerDirection":"random"}', "forward or reverse"],
    ['{"staggerMode":"automatic"}', "fixed or bounded"],
    ['{"staggerMode":null}', "fixed or bounded"],
    ['{"staggerMode":0}', "fixed or bounded"],
    ['{"staggerSpread":-0.01}', "between 0 and 1.5"],
    ['{"staggerSpread":1.51}', "between 0 and 1.5"],
    ['{"staggerSpread":30}', "between 0 and 1.5"],
    ['{"staggerSpread":"0.3"}', "finite number"],
    ['{"staggerSpread":null}', "finite number"],
    ['{"staggerSpread":1e999}', "finite number"],
    ['{"enterEasing":"ease-in"}', "Bézier"],
    ['{"enterEasing":null}', "Bézier"],
    ['{"exitEasing":"spring"}', "Bézier"],
    ['{"layoutEasing":"spring"}', "Bézier"],
    ['{"exitEasing":[0,1,2]}', "Bézier"],
    ['{"exitEasing":[0,1,1.1,1]}', "Bézier"],
    ['{"exitEasing":[0,"1",1,1]}', "Bézier"],
    ['{"exitEasing":[0,1,1,null]}', "Bézier"],
    ['{"entranceScaleStart":0.9}', "Unknown motion key"],
    ['{"entranceReveal":0.2}', "Unknown motion key"],
    ['{"exitFade":0.8}', "Unknown motion key"],
    ['{"entranceBlurDuration":0.4}', "Unknown motion key"],
    ['{"exitBlurDuration":0.6}', "Unknown motion key"],
    ['{"effectEasing":"linear"}', "Unknown motion key"],
    ['{"coordination":"coordinated"}', "Unknown motion key"],
    ['{"coordination":"independent"}', "Unknown motion key"],
    ['{"version":2}', "version 1"],
    ['{"version":1,"unknown":true}', "Unknown document key"],
  ];
  for (const [json, error] of invalid) {
    test(`rejects ${json}`, () => expect(() => parseMotionConfiguration(json!)).toThrow(error));
  }

  test("rejects incomplete or altered resolved snapshots, not just invalid motion values", () => {
    const document = JSON.parse(exportMotionConfiguration({}));
    document.resolved.duration = 999;
    expect(() => parseMotionConfiguration(JSON.stringify(document))).toThrow(
      "resolved.duration does not match",
    );
    document.resolved.duration = 440;
    document.resolved.surprise = true;
    expect(() => parseMotionConfiguration(JSON.stringify(document))).toThrow(
      "Unknown resolved key",
    );
    delete document.resolved.surprise;
    delete document.resolved.layoutDuration;
    expect(() => parseMotionConfiguration(JSON.stringify(document))).toThrow(
      "resolved.layoutDuration does not match",
    );
    delete document.motion.duration;
    expect(() => parseMotionConfiguration(JSON.stringify(document))).toThrow(
      "Missing motion key: duration",
    );
  });

  test("slows all resolved millisecond controls without changing author options or fractions", () => {
    const authored = {
      duration: 100,
      exitDuration: 160,
      stagger: 12,
      enterDelay: 30,
      exitDelay: 5,
      exitStagger: 7,
      entranceScalePeak: 0.2,
      springBounce: 0.4,
    };
    expect(motionAtPlaybackSpeed(authored, 0.25)).toMatchObject({
      duration: 400,
      exitDuration: 640,
      stagger: 48,
      enterStagger: 48,
      exitStagger: 28,
      enterDelay: 120,
      exitDelay: 20,
      layoutDuration: undefined,
      entranceScalePeak: 0.2,
      springBounce: 0.4,
    });
    expect(authored.duration).toBe(100);
    expect(authored.stagger).toBe(12);
    expect(() => motionAtPlaybackSpeed({}, 0)).toThrow("positive");
    expect(() => motionAtPlaybackSpeed({}, Number.NaN)).toThrow("positive");
  });

  test("playback scaling keeps automatic layout unresolved until the changed counts are known", () => {
    const options = {
      staggerMode: "fixed" as const,
      duration: 320,
      exitDuration: 200,
      enterDelay: 40,
      exitDelay: 30,
      enterStagger: 25,
      exitStagger: 10,
    };
    const slowed = motionAtPlaybackSpeed(options, 0.25);
    expect(slowed.layoutDuration).toBeUndefined();
    expect(JSON.parse(exportMotionConfiguration(slowed)).motion.layoutDuration).toBeNull();
    expect(transitionTimeline("x", "a b c", slowed).layoutDuration).toBe(1640);
    expect(transitionTimeline("a b c", "", slowed).layoutDuration).toBe(1000);
    expect(motionAtPlaybackSpeed({ ...options, layoutDuration: 0 }, 0.25).layoutDuration).toBe(0);
    expect(motionAtPlaybackSpeed({ ...options, layoutDuration: 700 }, 0.25).layoutDuration).toBe(
      2800,
    );
    expect(resolveMotionOptions(motionAtPlaybackSpeed({}, 0.25))).toMatchObject({
      enterDuration: 1760,
      exitDuration: 1760,
      enterStagger: 132,
      exitStagger: 132,
      layoutDuration: undefined,
    });
  });

  test("every declared nondeprecated control appears in the export", () => {
    expect(motionFieldKeys.map(String).sort()).toEqual(
      [
        "blur",
        "blurUnit",
        "duration",
        "enterAngle",
        "enterDelay",
        "enterEasing",
        "enterStagger",
        "entranceBlur",
        "entranceHeight",
        "entranceOpacity",
        "entranceOvershoot",
        "entranceRotation",
        "entranceScale",
        "entranceScalePeak",
        "entranceStartScale",
        "exitAngle",
        "exitBlur",
        "exitDelay",
        "exitDuration",
        "exitEasing",
        "exitHeight",
        "exitOpacity",
        "exitRotation",
        "exitScale",
        "exitStagger",
        "layoutDuration",
        "layoutEasing",
        "preserveMatching",
        "scale",
        "springBounce",
        "stagger",
        "staggerDirection",
        "staggerMode",
        "staggerSpread",
        "transformOrigin",
      ].sort(),
    );
  });
});

describe("timeline matching", () => {
  test("a price change preserves a suffix independently of its prefix", () => {
    expect(transitionTimeline("$19.00", "$29.00", {})).toEqual({
      prefix: ["$"],
      suffix: ["9", ".", "0", "0"],
      enters: [{ character: "2", index: 1, delay: 0, duration: 440 }],
      exits: [{ character: "1", index: 1, delay: 0, duration: 440 }],
      layoutDuration: 440,
      total: 440,
    });
  });

  test("leading and trailing whitespace keep their real indices", () => {
    const timeline = transitionTimeline("  cat! ", "  cut! ", {});
    expect(timeline.prefix).toEqual([" ", " ", "c"]);
    expect(timeline.suffix).toEqual(["t", "!", " "]);
    expect(timeline.enters).toEqual([{ character: "u", index: 3, delay: 0, duration: 440 }]);
    expect(timeline.exits).toEqual([{ character: "a", index: 3, delay: 0, duration: 440 }]);
  });

  test("prefix and suffix never overlap on repeated characters or deletion", () => {
    const append = transitionTimeline("11", "111", {});
    expect(append.prefix).toEqual(["1", "1"]);
    expect(append.suffix).toEqual([]);
    expect(append.enters).toEqual([{ character: "1", index: 2, delay: 0, duration: 440 }]);
    const deletion = transitionTimeline("aba", "aa", {});
    expect(deletion.prefix).toEqual(["a"]);
    expect(deletion.suffix).toEqual(["a"]);
    expect(deletion.enters).toEqual([]);
    expect(deletion.exits).toEqual([{ character: "b", index: 1, delay: 0, duration: 440 }]);
  });

  test("suffixes match graphemes, not code points", () => {
    const timeline = transitionTimeline("👩‍💻 á!", "🧑‍💻 á!", {});
    expect(timeline.prefix).toEqual([]);
    expect(timeline.suffix).toEqual([" ", "á", "!"]);
    expect(timeline.enters).toEqual([{ character: "🧑‍💻", index: 0, delay: 0, duration: 440 }]);
  });

  test("reverse stagger orders only changed visible characters and includes phase delays", () => {
    expect(
      transitionTimeline("a b!", "x yz!", {
        staggerMode: "fixed",
        duration: 100,
        exitDuration: 80,
        enterStagger: 10,
        exitStagger: 30,
        enterDelay: 7,
        exitDelay: 11,
        staggerDirection: "reverse",
        layoutDuration: 55,
      }),
    ).toEqual({
      prefix: [],
      suffix: ["!"],
      enters: [
        { character: "x", index: 0, delay: 27, duration: 100 },
        { character: "y", index: 2, delay: 17, duration: 100 },
        { character: "z", index: 3, delay: 7, duration: 100 },
      ],
      exits: [
        { character: "a", index: 0, delay: 41, duration: 80 },
        { character: "b", index: 2, delay: 11, duration: 80 },
      ],
      layoutDuration: 55,
      total: 127,
    });
  });

  test("matching can be disabled, but identical text is still not a transition", () => {
    const full = transitionTimeline("ab!", "ac!", { preserveMatching: false });
    expect(full.prefix).toEqual([]);
    expect(full.suffix).toEqual([]);
    expect(full.enters.map((bar) => bar.character)).toEqual(["a", "c", "!"]);
    expect(transitionTimeline("same", "same", { preserveMatching: false })).toMatchObject({
      enters: [],
      exits: [],
      total: 0,
      layoutDuration: 0,
    });
  });
});

test("sampling keeps em blur units and reads authored effect endpoints", () => {
  const enter = sampleEnter({
    entranceBlur: 0.35,
    blurUnit: "em",
    entranceOpacity: 0.25,
    entranceStartScale: 0.8,
  });
  expect(enter.samples[0]).toMatchObject({ blur: 0.35, blurUnit: "em", opacity: 0.25, scale: 0.8 });
  const exit = sampleExit({ exitBlur: 0.5, blurUnit: "em", exitOpacity: 0.2, exitScale: 0.75 });
  expect(exit.samples.at(-1)?.blur).toBeCloseTo(0.5);
  expect(exit.samples.at(-1)?.blurUnit).toBe("em");
  expect(exit.samples.at(-1)?.opacity).toBeCloseTo(0.2);
  expect(exit.samples.at(-1)?.scale).toBeCloseTo(0.75);
});

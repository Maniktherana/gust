import { describe, expect, test } from "bun:test";
import { DEFAULT_MOTION, resolveMotionOptions, resolveTransitionConfig } from "@gust-src/config";
import { motionAtPlaybackSpeed, transitionTimeline } from "./gust-motion";

describe("core bounded stagger policy", () => {
  test("defaults use a 30% batch spread and recompute gaps for every changed length", () => {
    expect(DEFAULT_MOTION).toMatchObject({ staggerMode: "bounded", staggerSpread: 0.3 });
    const options = { duration: 550, exitDuration: 550, stagger: 20, preserveMatching: false };
    const config = resolveMotionOptions(options);
    const snapshot = { ...config };
    const long = transitionTimeline("abcdefghijklmnopqrst", "ABCDEFGHIJKLMNOPQRST", options);
    const short = transitionTimeline("abcde", "ABCDE", options);
    expect(resolveTransitionConfig(config, 20, 20)).toMatchObject({
      enterStagger: 8.25,
      exitStagger: 8.25,
    });
    expect(long.enters[1].delay).toBe(8.25);
    expect(long.exits[1].delay).toBe(8.25);
    expect(long.enters.at(-1)?.delay).toBe(156.75);
    expect(long.layoutDuration).toBe(706.75);
    expect(short.enters[1].delay).toBe(33);
    expect(short.exits[1].delay).toBe(33);
    expect(short.enters.at(-1)?.delay).toBe(132);
    expect(config).toEqual(snapshot);
    expect(options).toEqual({
      duration: 550,
      exitDuration: 550,
      stagger: 20,
      preserveMatching: false,
    });
  });

  test("matching edges, whitespace and multi-code-point graphemes do not inflate batch counts", () => {
    const timeline = transitionTimeline("same a b!", "same 👩‍💻 á z!", {
      duration: 400,
      exitDuration: 200,
      enterDelay: 7,
      exitDelay: 11,
    });
    expect(timeline.prefix).toEqual(["s", "a", "m", "e", " "]);
    expect(timeline.suffix).toEqual(["!"]);
    expect(timeline.enters).toEqual([
      { character: "👩‍💻", index: 5, delay: 7, duration: 400 },
      { character: "á", index: 7, delay: 47, duration: 400 },
      { character: "z", index: 9, delay: 87, duration: 400 },
    ]);
    expect(timeline.exits).toEqual([
      { character: "a", index: 5, delay: 11, duration: 200 },
      { character: "b", index: 7, delay: 41, duration: 200 },
    ]);
    expect(timeline.layoutDuration).toBe(487);
    expect(timeline.total).toBe(487);
  });

  test("exit batches use their own duration and count, including deletion-only transitions", () => {
    const options = { duration: 400, exitDuration: 800, enterDelay: 10, exitDelay: 20 };
    expect(resolveTransitionConfig(resolveMotionOptions(options), 4, 2)).toMatchObject({
      enterStagger: 30,
      exitStagger: 120,
    });
    const mixed = transitionTimeline("xy", "abcd", options);
    expect(mixed.enters.map((bar) => bar.delay)).toEqual([10, 40, 70, 100]);
    expect(mixed.exits.map((bar) => bar.delay)).toEqual([20, 140]);
    expect(mixed.layoutDuration).toBe(500);
    expect(mixed.total).toBe(940);
    const deletion = transitionTimeline("x y", "", options);
    expect(deletion.enters).toEqual([]);
    expect(deletion.exits.map((bar) => bar.delay)).toEqual([20, 140]);
    expect(deletion.layoutDuration).toBe(940);
    expect(deletion.total).toBe(940);
  });

  test("zero spread starts each batch together and 150% is not capped at 100%", () => {
    for (const staggerSpread of [0, 1.5]) {
      const timeline = transitionTimeline("xy", "abc", {
        duration: 300,
        exitDuration: 200,
        enterDelay: 10,
        exitDelay: 20,
        staggerSpread,
      });
      expect(timeline.enters.map((bar) => bar.delay)).toEqual(
        staggerSpread === 0 ? [10, 10, 10] : [10, 160, 310],
      );
      expect(timeline.exits.map((bar) => bar.delay)).toEqual(
        staggerSpread === 0 ? [20, 20] : [20, 170],
      );
      expect(timeline.layoutDuration).toBe(staggerSpread === 0 ? 310 : 610);
      expect(timeline.total).toBe(staggerSpread === 0 ? 310 : 610);
    }
  });

  test("reverse order uses the same bounded gaps and final entrance layout deadline", () => {
    const timeline = transitionTimeline("a b!", "x yz!", {
      duration: 300,
      exitDuration: 200,
      enterDelay: 7,
      exitDelay: 11,
      staggerDirection: "reverse",
    });
    expect(timeline.enters.map((bar) => bar.delay)).toEqual([67, 37, 7]);
    expect(timeline.exits.map((bar) => bar.delay)).toEqual([41, 11]);
    expect(timeline.layoutDuration).toBe(367);
    expect(timeline.total).toBe(367);
  });

  test("empty batches and unchanged values do not create phantom stagger bars", () => {
    expect(resolveTransitionConfig(resolveMotionOptions(), 0, 0)).toMatchObject({
      enterStagger: 0,
      exitStagger: 0,
    });
    expect(transitionTimeline("same", "same", {})).toMatchObject({
      enters: [],
      exits: [],
      total: 0,
      layoutDuration: 0,
    });
    const spaces = transitionTimeline(" \t", "\n  ", {});
    expect(spaces.enters).toEqual([]);
    expect(spaces.exits).toEqual([]);
    expect(Number.isFinite(spaces.total)).toBe(true);
    expect(transitionTimeline("", "abc", {}).enters.map((bar) => bar.delay)).toEqual([0, 44, 88]);
  });

  test("playback speed scales dynamic gaps and layout without scaling the percentage", () => {
    const options = {
      duration: 400,
      exitDuration: 800,
      enterDelay: 10,
      exitDelay: 20,
      staggerSpread: 1.5,
    };
    const original = transitionTimeline("xy", "abcd", options);
    for (const speed of [0.25, 2]) {
      const playback = motionAtPlaybackSpeed(options, speed);
      expect(playback.staggerSpread).toBe(1.5);
      expect(resolveMotionOptions(playback).staggerMode).toBe("bounded");
      const scaled = transitionTimeline("xy", "abcd", playback);
      for (const phase of ["enters", "exits"] as const) {
        expect(scaled[phase]).toEqual(
          original[phase].map((bar) => ({
            ...bar,
            duration: bar.duration / speed,
            delay: bar.delay / speed,
          })),
        );
      }
      expect(scaled.layoutDuration).toBe(original.layoutDuration / speed);
      expect(scaled.total).toBe(original.total / speed);
    }
    expect(options.staggerSpread).toBe(1.5);
    expect(options.duration).toBe(400);
  });
});

test("fixed layout ends with the last entrance while total time still includes later exits", () => {
  const options = {
    staggerMode: "fixed" as const,
    duration: 320,
    exitDuration: 200,
    enterDelay: 40,
    exitDelay: 800,
    enterStagger: 25,
    exitStagger: 10,
  };
  for (const staggerDirection of ["forward", "reverse"] as const) {
    const timeline = transitionTimeline("x", "a b c", { ...options, staggerDirection });
    expect(timeline.enters).toHaveLength(3);
    expect(timeline.layoutDuration).toBe(410);
    expect(timeline.exits[0].duration).toBe(200);
    expect(timeline.total).toBe(1000);
  }
  expect(transitionTimeline("a b c", "", options).layoutDuration).toBe(1020);
  expect(transitionTimeline("same", "same", options).layoutDuration).toBe(0);
  expect(transitionTimeline("x", "a b c", { staggerMode: "fixed" }).layoutDuration).toBe(506);
  expect(transitionTimeline("x", "a b c", {}).layoutDuration).toBe(528);
  for (const staggerMode of ["fixed", "bounded"] as const) {
    for (const layoutDuration of [0, 5, 700]) {
      expect(
        transitionTimeline("x", "a b c", { ...options, staggerMode, layoutDuration })
          .layoutDuration,
      ).toBe(layoutDuration);
      expect(
        transitionTimeline("a b c", "", { ...options, staggerMode, layoutDuration }).layoutDuration,
      ).toBe(layoutDuration);
    }
  }
});

import { describe, expect, test } from "bun:test";

import {
  commonEdges,
  commonPrefixLength,
  displayCharacter,
  isForwardAppend,
  normalizeText,
  resolveGustCharacterRenderState,
  splitCharacters,
  splitGraphemes,
} from "../src/characters";
import type { GustCharacterRenderState } from "../src/characters";

function transition(previous: string, next: string, state?: GustCharacterRenderState, version = 1) {
  const initial =
    state ??
    resolveGustCharacterRenderState({
      activeWord: previous,
      previousText: "",
      previousEntries: new Map(),
      preservePrefix: true,
      transitionVersion: 0,
    });
  return resolveGustCharacterRenderState({
    activeWord: next,
    previousText: previous,
    previousEntries: initial.entries,
    preservePrefix: true,
    transitionVersion: version,
  });
}

describe("text bookkeeping", () => {
  test("preserves caller whitespace without substituting characters", () => {
    expect(normalizeText(" word \t")).toBe(" word \t");
    expect(normalizeText(0)).toBe("0");
    expect(splitCharacters(" a ").map(({ character }) => character)).toEqual([" ", "a", " "]);
    expect(displayCharacter(" ")).toBe(" ");
    expect(displayCharacter("\t")).toBe("\t");
  });

  test("incoming whitespace stays stable and does not consume stagger order", () => {
    const state = transition("", " A\t👩🏽‍💻\u00a0B ");
    expect(
      state.characters.filter(({ stable }) => stable).map(({ character }) => character),
    ).toEqual([" ", "\t", "\u00a0", " "]);
    expect(
      state.characters
        .filter(({ stable }) => !stable)
        .map(({ character, order }) => ({ character, order })),
    ).toEqual([
      { character: "A", order: 0 },
      { character: "👩🏽‍💻", order: 1 },
      { character: "B", order: 2 },
    ]);
  });

  test("segments user-perceived graphemes", () => {
    expect(splitGraphemes("A👨‍👩‍👧‍👦é")).toEqual(["A", "👨‍👩‍👧‍👦", "é"]);
    expect(commonPrefixLength("👩🏽‍💻 ship", "👩🏽‍💻 shipped")).toBe(6);
    expect(isForwardAppend("👩🏽‍💻 ship", "👩🏽‍💻 shipped")).toBe(true);
    expect(commonEdges("👩🏽‍💻 one é", "👩🏽‍💻 two é")).toEqual({ prefix: 2, suffix: 2 });
  });

  test("renders the first value statically", () => {
    const state = resolveGustCharacterRenderState({
      activeWord: "ready",
      preservePrefix: true,
      previousEntries: new Map(),
      previousText: "",
      transitionVersion: 0,
    });
    expect(state.characters.every(({ stable }) => stable)).toBe(true);
    expect(state.preservedPrefixLength).toBe(5);
    expect(state.preservedSuffixLength).toBe(0);
  });

  for (const [previous, next, prefix, suffix] of [
    ["Creative", "Craft", 2, 0],
    ["$1,234.00", "$1,235.00", 5, 3],
    ["abc", "zabc", 0, 3],
    ["zabc", "abc", 0, 3],
    ["ab", "abc", 2, 0],
    ["abc", "ab", 2, 0],
    ["aaaa", "aaa", 3, 0],
    ["aaaa", "aabaa", 2, 2],
    ["same", "same", 4, 0],
    ["", "new", 0, 0],
    ["old", "", 0, 0],
    ["old", "new", 0, 0],
  ] as const) {
    test(`${JSON.stringify(previous)} → ${JSON.stringify(next)} preserves only nonoverlapping edges`, () => {
      expect(commonEdges(previous, next)).toEqual({ prefix, suffix });
      const state = transition(previous, next);
      expect(state.characters.filter(({ stable }) => stable)).toHaveLength(prefix + suffix);
      expect(new Set(state.characters.map(({ entryKey }) => entryKey)).size).toBe(
        state.characters.length,
      );
    });
  }

  test("a suffix keeps its entry object, key, and in-flight state when its index shifts", () => {
    const first = transition("", "tail");
    const next = transition("tail", "long tail", first, 2);
    expect(next.entries.get(5)).toBe(first.entries.get(0));
    expect(next.entries.get(8)).toBe(first.entries.get(3));
    expect(next.characters[5].stable).toBe(false);
    expect(next.characters[5].entryKey).toBe(first.characters[0].entryKey);
    expect(next.characters.slice(0, 4).map(({ order }) => order)).toEqual([0, 1, 2, 3]);
  });

  test("disabling matching replaces even the shared edges", () => {
    const first = transition("", "same");
    const next = resolveGustCharacterRenderState({
      activeWord: "same!",
      previousText: "same",
      previousEntries: first.entries,
      preservePrefix: false,
      transitionVersion: 2,
    });
    expect(next.preservedPrefixLength).toBe(0);
    expect(next.preservedSuffixLength).toBe(0);
    expect(next.characters.every(({ entryKey }) => entryKey.startsWith("2-"))).toBe(true);
  });
});

import { describe, expect, test } from "bun:test";

import {
  commonPrefixLength,
  displayCharacter,
  isForwardAppend,
  normalizeWords,
  resolveGustCharacterRenderState,
  splitCharacters,
  splitGraphemes,
} from "../src/characters";
import { resolveGustConfig } from "../src/config";

const config = resolveGustConfig({
  blur: true,
  duration: 440,
  entranceHeight: 8,
  entranceScale: 1.1,
  exitDuration: 360,
  exitHeight: 90,
  exitScale: 0.4,
  scale: true,
  stagger: 12,
});

describe("text bookkeeping", () => {
  test("keeps consumer-provided empty and whitespace values intact", () => {
    expect(normalizeWords(["", "  ", "word"])).toEqual(["", "  ", "word"]);
    expect(splitCharacters(" a ").map(({ character }) => character)).toEqual([" ", "a", " "]);
    expect(displayCharacter(" ")).toBe("\u00a0");
  });

  test("segments user-perceived graphemes", () => {
    expect(splitGraphemes("A👨‍👩‍👧‍👦é")).toEqual(["A", "👨‍👩‍👧‍👦", "é"]);
    expect(commonPrefixLength("👩🏽‍💻 ship", "👩🏽‍💻 shipped")).toBe(6);
    expect(isForwardAppend("👩🏽‍💻 ship", "👩🏽‍💻 shipped")).toBe(true);
  });

  test("renders the first value statically", () => {
    const characters = splitCharacters("ready");
    const state = resolveGustCharacterRenderState({
      activeWord: "ready",
      characters,
      config,
      preservePrefix: true,
      previousEntries: new Map(),
      previousText: "",
      transitionVersion: 0,
    });

    expect(state.characters.every(({ stable }) => stable)).toBe(true);
    expect(state.preservedPrefixLength).toBe(characters.length);
    expect(state.stablePrefixLength).toBe(characters.length);
  });
});

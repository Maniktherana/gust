import { describe, expect, test } from "bun:test";

import {
  commonPrefixLength,
  displayCharacter,
  isForwardAppend,
  normalizeText,
  resolveGustCharacterRenderState,
  splitCharacters,
  splitGraphemes,
} from "../src/characters";
import { resolveGustConfig } from "../src/config";

const config = resolveGustConfig({
  blur: true,
  duration: 440,
  enterAngle: -90,
  entranceHeight: 8,
  entranceOffset: 90,
  entranceScale: 1.1,
  exitDuration: 360,
  exitAngle: -90,
  exitBlurCap: 4,
  exitHeight: 90,
  exitScale: 0.4,
  scale: true,
  stagger: 12,
});

describe("text bookkeeping", () => {
  test("normalizes outer whitespace but preserves internal character slots", () => {
    expect(normalizeText(" word ")).toBe("word");
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

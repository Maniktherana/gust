// Reads Gust's own baked keyframes so the reference charts plot exactly what
// the component animates, rather than a hand-drawn approximation.

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_OVERSHOOT,
  DEFAULT_ENTRANCE_BLUR,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_BLUR,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
  resolveLayoutDuration,
} from "@gust-src/config";
import { commonPrefixLength, isWhitespaceCharacter, splitGraphemes } from "@gust-src/characters";
import { buildEnterKeyframes, buildExitKeyframes } from "@gust-src/keyframes";

export type MotionSettings = {
  blur: boolean;
  duration: number;
  enterAngle: number;
  entranceBlur: number;
  entranceOvershoot: number;
  entranceHeight: number;
  entranceScale: number;
  exitAngle: number;
  exitBlur: number;
  exitDuration: number;
  exitHeight: number;
  exitScale: number;
  preservePrefix: boolean;
  scale: boolean;
  stagger: number;
};

export const defaultMotion: MotionSettings = {
  blur: true,
  duration: DEFAULT_DURATION_MS,
  enterAngle: DEFAULT_ENTER_ANGLE,
  entranceBlur: DEFAULT_ENTRANCE_BLUR,
  entranceOvershoot: DEFAULT_ENTRANCE_OVERSHOOT,
  entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
  entranceScale: DEFAULT_ENTRANCE_SCALE,
  exitAngle: DEFAULT_EXIT_ANGLE,
  exitBlur: DEFAULT_EXIT_BLUR,
  exitDuration: DEFAULT_EXIT_DURATION_MS,
  exitHeight: DEFAULT_EXIT_HEIGHT,
  exitScale: DEFAULT_EXIT_SCALE,
  preservePrefix: true,
  scale: true,
  stagger: DEFAULT_STAGGER_MS,
};

export type MotionSample = {
  blur: number;
  opacity: number;
  scale: number;
  time: number;
  // Distance along the travel direction in em. Entrances start negative (before
  // the resting spot), cross zero, overshoot, and settle back to zero.
  travel: number;
};

export type MotionCurve = {
  duration: number;
  samples: MotionSample[];
};

const translatePattern = /translate\((-?[\d.]+)em, (-?[\d.]+)em\)/;
const scalePattern = /scale\((-?[\d.]+)\)/;
const blurPattern = /blur\((-?[\d.]+)px\)/;

function readNumber(pattern: RegExp, text: string, group = 1, fallback = 0) {
  const match = pattern.exec(text);

  return match ? Number(match[group]) : fallback;
}

function toCurve(baked: { duration: number; keyframes: Keyframe[] }, angle: number): MotionCurve {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    duration: baked.duration,
    samples: baked.keyframes.map((keyframe) => {
      const transform = String(keyframe.transform ?? "");
      const x = readNumber(translatePattern, transform, 1);
      const y = readNumber(translatePattern, transform, 2);

      return {
        blur: readNumber(blurPattern, String(keyframe.filter ?? "")),
        opacity: Number(keyframe.opacity ?? 1),
        scale: readNumber(scalePattern, transform, 1, 1),
        time: Number(keyframe.offset ?? 0) * baked.duration,
        travel: x * cos + y * sin,
      };
    }),
  };
}

function resolve(settings: MotionSettings) {
  return resolveGustConfig(settings);
}

export function sampleEnter(settings: MotionSettings): MotionCurve {
  const config = resolve(settings);

  return toCurve(buildEnterKeyframes(config), config.enterAngle);
}

export function sampleExit(settings: MotionSettings): MotionCurve {
  const config = resolve(settings);

  return toCurve(buildExitKeyframes(config), config.exitAngle);
}

export type TimelineBar = {
  character: string;
  delay: number;
  duration: number;
  index: number;
};

export type TransitionTimeline = {
  enters: TimelineBar[];
  exits: TimelineBar[];
  layoutDuration: number;
  prefix: string[];
  total: number;
};

// Mirrors how Gust orders characters: the shared prefix stays put, whitespace
// never animates, and every other character is delayed by its order × stagger.
export function transitionTimeline(
  previous: string,
  next: string,
  settings: MotionSettings,
): TransitionTimeline {
  const config = resolve(settings);
  const previousText = previous.trim();
  const nextText = next.trim();
  const previousCharacters = splitGraphemes(previousText);
  const nextCharacters = splitGraphemes(nextText);
  const prefixLength = settings.preservePrefix ? commonPrefixLength(previousText, nextText) : 0;

  const bars = (characters: string[], duration: number, stagger: number) =>
    characters
      .slice(prefixLength)
      .map((character, offset) => ({ character, index: prefixLength + offset }))
      .filter(({ character }) => !isWhitespaceCharacter(character))
      .map(({ character, index }, order) => ({
        character,
        delay: order * stagger,
        duration,
        index,
      }));

  const exits = bars(previousCharacters, config.exitDuration, config.exitStagger);
  const enters = bars(nextCharacters, config.enterDuration, config.enterStagger);
  const end = (list: TimelineBar[]) =>
    list.reduce((latest, bar) => Math.max(latest, bar.delay + bar.duration), 0);
  const layoutDuration = previousText === nextText ? 0 : resolveLayoutDuration(config.duration);

  return {
    enters,
    exits,
    layoutDuration,
    prefix: nextCharacters.slice(0, prefixLength),
    total: Math.max(end(exits), end(enters), layoutDuration),
  };
}

// How long a demo should rest on a value before moving on: long enough for the
// whole transition to land, plus a beat to read it.
export function holdFor(previous: string, next: string, settings: MotionSettings, rest = 1100) {
  return transitionTimeline(previous, next, settings).total + rest;
}

// The most characters any step of a cycle moves, so a chart can keep one
// height for the whole cycle instead of jumping between words.
export function cycleRows(words: readonly string[], settings: MotionSettings) {
  return words.reduce((most, word, index) => {
    const next = words[(index + 1) % words.length] ?? word;
    const { enters, exits } = transitionTimeline(word, next, settings);

    return Math.max(most, enters.length, exits.length);
  }, 1);
}

// Reads Gust's own baked keyframes so the reference charts plot exactly what
// the component animates, rather than a hand-drawn approximation.

import {
  DEFAULT_MOTION,
  DEFAULT_STAGGER_MS,
  resolveMotionOptions,
  resolveLayoutDuration,
  resolveTransitionConfig,
  type GustMotionOptions,
  type GustEasing,
} from "@gust-src/config";
import { commonEdges, isWhitespaceCharacter, splitGraphemes } from "@gust-src/characters";
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

export const defaultMotion: MotionSettings & GustMotionOptions = {
  ...DEFAULT_MOTION,
  preservePrefix: true,
};

export type MotionSample = {
  blur: number;
  blurUnit: "px" | "em";
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
const blurPattern = /blur\((-?[\d.e+-]+)(px|em)\)/;

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
        blurUnit: blurPattern.exec(String(keyframe.filter ?? ""))?.[2] === "em" ? "em" : "px",
        opacity: Number(keyframe.opacity ?? 1),
        scale: readNumber(scalePattern, transform, 1, 1),
        time: Number(keyframe.offset ?? 0) * baked.duration,
        travel: x * cos + y * sin,
      };
    }),
  };
}

export function sampleEnter(settings: GustMotionOptions): MotionCurve {
  const config = resolveMotionOptions(settings);

  return toCurve(buildEnterKeyframes(config), config.enterAngle);
}

export function sampleExit(settings: GustMotionOptions): MotionCurve {
  const config = resolveMotionOptions(settings);

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
  suffix: string[];
  total: number;
};

// Matching edges use the engine's grapheme-aware helper, including whitespace.
export function transitionTimeline(
  previous: string,
  next: string,
  settings: GustMotionOptions,
): TransitionTimeline {
  const baseConfig = resolveMotionOptions(settings);
  const previousCharacters = splitGraphemes(previous);
  const nextCharacters = splitGraphemes(next);
  const { prefix, suffix } = baseConfig.preserveMatching
    ? commonEdges(previous, next)
    : { prefix: 0, suffix: 0 };

  const changed = (characters: string[]) =>
    characters
      .slice(prefix, characters.length - suffix)
      .map((character, offset) => ({ character, index: prefix + offset }))
      .filter(({ character }) => !isWhitespaceCharacter(character));
  const entering = previous === next ? [] : changed(nextCharacters);
  const exiting = previous === next ? [] : changed(previousCharacters);
  const config = resolveTransitionConfig(baseConfig, entering.length, exiting.length);
  const bars = (
    characters: { character: string; index: number }[],
    duration: number,
    stagger: number,
    delay: number,
  ) =>
    characters.map(({ character, index }, order, animated) => ({
      character,
      delay:
        delay +
        (config.staggerDirection === "reverse" ? animated.length - order - 1 : order) * stagger,
      duration,
      index,
    }));

  const exits = bars(exiting, config.exitDuration, config.exitStagger, config.exitDelay);
  const enters = bars(entering, config.enterDuration, config.enterStagger, config.enterDelay);
  const end = (list: TimelineBar[]) =>
    list.reduce((latest, bar) => Math.max(latest, bar.delay + bar.duration), 0);
  const layoutDuration =
    previous === next ? 0 : resolveLayoutDuration(config, enters.length, exits.length);

  return {
    enters,
    exits,
    layoutDuration,
    prefix: nextCharacters.slice(0, prefix),
    suffix: suffix ? nextCharacters.slice(-suffix) : [],
    total: Math.max(end(exits), end(enters), layoutDuration),
  };
}

// How long a demo should rest on a value before moving on: long enough for the
// whole transition to land, plus a beat to read it.
export function holdFor(previous: string, next: string, settings: GustMotionOptions, rest = 1100) {
  return transitionTimeline(previous, next, settings).total + rest;
}

// The most characters any step of a cycle moves, so a chart can keep one
// height for the whole cycle instead of jumping between words.
export function cycleRows(words: readonly string[], settings: GustMotionOptions) {
  return words.reduce((most, word, index) => {
    const next = words[(index + 1) % words.length] ?? word;
    const { enters, exits } = transitionTimeline(word, next, settings);

    return Math.max(most, enters.length, exits.length);
  }, 1);
}

type DeprecatedMotionKey = "preservePrefix" | "entranceBlurCap" | "entranceOffset" | "exitBlurCap";
export type MotionFieldKey = Exclude<keyof GustMotionOptions, DeprecatedMotionKey>;
export type MotionField = {
  label: string;
  kind: "number" | "boolean" | "enum" | "easing";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  choices?: readonly string[];
  auto?: string;
};

const milliseconds = { kind: "number", min: 0, step: 10, unit: "ms" } as const;
const fraction = { kind: "number", min: 0, max: 1, step: 0.01, unit: "fraction" } as const;
const degrees = { kind: "number", min: -180, max: 180, step: 1, unit: "deg" } as const;
const distance = { kind: "number", min: 0, step: 1, unit: "1/100 em" } as const;
const scaleField = { kind: "number", min: 0, max: 2, step: 0.01, unit: "×" } as const;

// The mapped type makes a newly added engine control a compile error until the lab represents it.
export const motionFields: Record<MotionFieldKey, MotionField> = {
  duration: { label: "Entrance duration", ...milliseconds },
  exitDuration: { label: "Exit duration", ...milliseconds },
  enterDelay: { label: "Entrance delay", ...milliseconds },
  exitDelay: { label: "Exit delay", ...milliseconds },
  staggerMode: { label: "Stagger mode", kind: "enum", choices: ["fixed", "bounded"] },
  staggerSpread: { label: "Stagger spread", kind: "number", min: 0, max: 1.5, step: 0.01 },
  stagger: { label: "Shared stagger", ...milliseconds },
  enterStagger: { label: "Entrance stagger", ...milliseconds, auto: "Uses shared stagger" },
  exitStagger: { label: "Exit stagger", ...milliseconds, auto: "Uses shared stagger" },
  staggerDirection: { label: "Stagger order", kind: "enum", choices: ["forward", "reverse"] },
  enterAngle: { label: "Entrance angle", ...degrees },
  exitAngle: { label: "Exit angle", ...degrees },
  entranceHeight: { label: "Entrance travel", ...distance },
  exitHeight: { label: "Exit travel", ...distance },
  entranceOvershoot: { label: "Entrance overshoot", ...distance },
  scale: { label: "Enable scale", kind: "boolean" },
  entranceStartScale: { label: "Entrance initial scale", ...scaleField },
  entranceScale: { label: "Entrance peak scale", ...scaleField },
  exitScale: { label: "Exit final scale", ...scaleField, max: 1.5 },
  entranceScalePeak: { label: "Peak point", ...fraction, min: 0.01, max: 0.99 },
  entranceOpacity: { label: "Entrance initial opacity", ...fraction },
  exitOpacity: { label: "Exit final opacity", ...fraction },
  entranceRotation: { label: "Entrance rotation", ...degrees },
  exitRotation: { label: "Exit rotation", ...degrees },
  transformOrigin: {
    label: "Transform origin",
    kind: "enum",
    choices: ["center", "top", "bottom"],
  },
  blur: { label: "Enable blur", kind: "boolean" },
  entranceBlur: { label: "Entrance blur", kind: "number", min: 0, step: 0.01 },
  exitBlur: { label: "Exit blur", kind: "number", min: 0, step: 0.01 },
  blurUnit: { label: "Blur unit", kind: "enum", choices: ["px", "em"] },
  enterEasing: { label: "Entrance easing", kind: "easing" },
  springBounce: { label: "Spring bounce", kind: "number", min: 0.1, max: 0.8, step: 0.01 },
  exitEasing: { label: "Exit easing", kind: "easing" },
  layoutDuration: {
    label: "Layout duration",
    ...milliseconds,
    auto: "Finishes with the last entering character",
  },
  layoutEasing: { label: "Layout easing", kind: "easing" },
  preserveMatching: { label: "Preserve matching prefix and suffix", kind: "boolean" },
};

export const motionFieldKeys = Object.keys(motionFields) as MotionFieldKey[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEasing(value: unknown, key: string) {
  if (value === "linear" || value === "ease-out" || (key === "enterEasing" && value === "spring"))
    return;
  if (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) &&
    value[0] >= 0 &&
    value[0] <= 1 &&
    value[2] >= 0 &&
    value[2] <= 1
  )
    return;
  throw new Error(
    `${key}: use "linear", "ease-out", or four finite Bézier coordinates; x1 and x2 must be between 0 and 1.`,
  );
}

function validateAuthorOptions(value: unknown, complete = false): GustMotionOptions {
  if (!isRecord(value)) throw new Error("Motion must be a JSON object.");
  const options: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(motionFields, key)) throw new Error(`Unknown motion key: ${key}.`);
    const field = motionFields[key as MotionFieldKey];
    const candidate = value[key];
    if (candidate === null && field.auto) continue;
    if (field.kind === "number") {
      if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
        throw new Error(`${key}: expected a finite number.`);
      }
      const min = field.min ?? -Number.MAX_SAFE_INTEGER;
      const max = field.max ?? Number.MAX_SAFE_INTEGER;
      if (candidate < min || candidate > max)
        throw new Error(`${key}: must be between ${min} and ${max}.`);
    } else if (field.kind === "boolean") {
      if (typeof candidate !== "boolean") throw new Error(`${key}: expected true or false.`);
    } else if (field.kind === "enum") {
      if (typeof candidate !== "string" || !field.choices?.includes(candidate)) {
        throw new Error(`${key}: expected ${field.choices?.join(" or ")}.`);
      }
    } else {
      validateEasing(candidate, key);
    }
    options[key] = candidate;
  }
  if (complete) {
    for (const key of motionFieldKeys) {
      if (!Object.hasOwn(value, key))
        throw new Error(`Missing motion key: ${key}. Use null for automatic controls.`);
    }
  }
  // Validation above is deliberately stricter than the engine's clamping resolver.
  const motion = options as GustMotionOptions;
  resolveMotionOptions(motion);
  return motion;
}

type SerializedMotionValue = number | boolean | string | GustEasing | null;

export function completeAuthorMotion(options: GustMotionOptions) {
  const resolved = resolveMotionOptions(options);
  return Object.fromEntries(
    motionFieldKeys.map((key) => [
      key,
      options[key] ??
        ((key === "enterStagger" || key === "exitStagger") && options.stagger === undefined
          ? resolved[key]
          : motionFields[key].auto
            ? null
            : key === "stagger"
              ? DEFAULT_STAGGER_MS
              : resolved[key as keyof typeof resolved]),
    ]),
  ) as Record<MotionFieldKey, SerializedMotionValue>;
}

function resolvedSnapshot(options: GustMotionOptions) {
  return Object.fromEntries(
    Object.entries(resolveMotionOptions(options)).map(([key, value]) => [key, value ?? null]),
  );
}

export function exportMotionConfiguration(options: GustMotionOptions) {
  const motion = completeAuthorMotion(options);
  const validated = validateAuthorOptions(motion, true);
  return JSON.stringify({ version: 1, motion, resolved: resolvedSnapshot(validated) }, null, 2);
}

/** Accepts an exported document or a plain, strictly checked GustMotionOptions object. */
export function parseMotionConfiguration(json: string): GustMotionOptions {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON. Check quotes, commas, and brackets.");
  }
  if (!isRecord(value)) throw new Error("Configuration must be a JSON object.");
  if (!Object.hasOwn(value, "version")) return validateAuthorOptions(value);
  for (const key of Object.keys(value)) {
    if (!["version", "motion", "resolved"].includes(key))
      throw new Error(`Unknown document key: ${key}.`);
  }
  if (value.version !== 1)
    throw new Error("Unsupported configuration version. Expected version 1.");
  const motion = validateAuthorOptions(value.motion, true);
  if (!isRecord(value.resolved)) throw new Error("Missing resolved configuration snapshot.");
  const expected = resolvedSnapshot(motion);
  for (const key of new Set([...Object.keys(expected), ...Object.keys(value.resolved)])) {
    if (!Object.hasOwn(expected, key)) throw new Error(`Unknown resolved key: ${key}.`);
    if (JSON.stringify(value.resolved[key]) !== JSON.stringify(expected[key])) {
      throw new Error(
        `resolved.${key} does not match motion. Import just the motion object when editing by hand.`,
      );
    }
  }
  return motion;
}

/** Resolve before stretching, so automatic layout timing and inherited stagger slow down too. */
export function motionAtPlaybackSpeed(
  options: GustMotionOptions,
  speed: number,
): GustMotionOptions {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error("Playback speed must be positive.");
  const resolved = resolveMotionOptions(options);
  return {
    ...options,
    duration: resolved.duration / speed,
    exitDuration: resolved.exitDuration / speed,
    enterDelay: resolved.enterDelay / speed,
    exitDelay: resolved.exitDelay / speed,
    stagger: (options.stagger ?? DEFAULT_STAGGER_MS) / speed,
    enterStagger: resolved.enterStagger / speed,
    exitStagger: resolved.exitStagger / speed,
    layoutDuration:
      resolved.layoutDuration === undefined ? undefined : resolved.layoutDuration / speed,
  };
}

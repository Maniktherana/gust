import { easeOutStrong } from "./easing";

export const DEFAULT_DURATION_MS = 440;
export const DEFAULT_EXIT_DURATION_MS = 440;
export const DEFAULT_STAGGER_MS = 110;
export const DEFAULT_ENTER_ANGLE = -90;
export const DEFAULT_EXIT_ANGLE = -90;
export const DEFAULT_ENTRANCE_HEIGHT = 70;
export const DEFAULT_ENTRANCE_OVERSHOOT = 10;
export const DEFAULT_ENTRANCE_SCALE = 1.1;
export const DEFAULT_ENTRANCE_BLUR = 0;
export const DEFAULT_EXIT_HEIGHT = 110;
export const DEFAULT_EXIT_SCALE = 0.6;
export const DEFAULT_EXIT_BLUR = 3;
/** @deprecated Use DEFAULT_ENTRANCE_HEIGHT. */
export const DEFAULT_ENTRANCE_OFFSET = DEFAULT_ENTRANCE_HEIGHT;
/** @deprecated Use DEFAULT_ENTRANCE_BLUR. */
export const DEFAULT_ENTRANCE_BLUR_CAP = DEFAULT_ENTRANCE_BLUR;
/** @deprecated Use DEFAULT_EXIT_BLUR. */
export const DEFAULT_EXIT_BLUR_CAP = DEFAULT_EXIT_BLUR;

export type GustEasing = "linear" | "ease-out" | readonly [number, number, number, number];
export type GustDirection = "up" | "down" | "left" | "right";

/** Durations and delays are milliseconds; travel distances are hundredths of an em. */
export type GustMotionOptions = {
  duration?: number;
  exitDuration?: number;
  enterDelay?: number;
  exitDelay?: number;
  stagger?: number;
  staggerMode?: "fixed" | "bounded";
  /** Fraction of each duration shared across its stagger batch, from 0 to 1.5. */
  staggerSpread?: number;
  enterStagger?: number;
  exitStagger?: number;
  staggerDirection?: "forward" | "reverse";
  enterAngle?: number;
  exitAngle?: number;
  entranceHeight?: number;
  exitHeight?: number;
  entranceOvershoot?: number;
  scale?: boolean;
  entranceStartScale?: number;
  entranceScale?: number;
  exitScale?: number;
  /** Point on the eased entrance timeline where travel and scale reach their peak. */
  entranceScalePeak?: number;
  entranceOpacity?: number;
  exitOpacity?: number;
  entranceRotation?: number;
  exitRotation?: number;
  transformOrigin?: "center" | "top" | "bottom";
  blur?: boolean;
  entranceBlur?: number;
  exitBlur?: number;
  blurUnit?: "px" | "em";
  /** One easing curve for every entrance property. */
  enterEasing?: GustEasing | "spring";
  springBounce?: number;
  exitEasing?: GustEasing;
  layoutDuration?: number;
  layoutEasing?: GustEasing;
  /** Preserve matching leading and trailing sections. False replaces the entire value. */
  preserveMatching?: boolean;
  /** @deprecated Use preserveMatching. */
  preservePrefix?: boolean;
  /** @deprecated Use entranceBlur. */
  entranceBlurCap?: number;
  /** @deprecated Use entranceHeight. */
  entranceOffset?: number;
  /** @deprecated Use exitBlur. */
  exitBlurCap?: number;
};

export const DEFAULT_MOTION = {
  duration: DEFAULT_DURATION_MS,
  exitDuration: DEFAULT_EXIT_DURATION_MS,
  enterDelay: 0,
  exitDelay: 0,
  stagger: DEFAULT_STAGGER_MS,
  staggerMode: "bounded",
  staggerSpread: 0.3,
  enterStagger: 33,
  exitStagger: 33,
  staggerDirection: "forward",
  enterAngle: DEFAULT_ENTER_ANGLE,
  exitAngle: DEFAULT_EXIT_ANGLE,
  entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
  exitHeight: DEFAULT_EXIT_HEIGHT,
  entranceOvershoot: DEFAULT_ENTRANCE_OVERSHOOT,
  scale: true,
  entranceStartScale: 0.6,
  entranceScale: DEFAULT_ENTRANCE_SCALE,
  exitScale: DEFAULT_EXIT_SCALE,
  entranceScalePeak: 0.99,
  entranceOpacity: 0,
  exitOpacity: 0,
  entranceRotation: 0,
  exitRotation: 0,
  transformOrigin: "center",
  blur: true,
  entranceBlur: DEFAULT_ENTRANCE_BLUR,
  exitBlur: DEFAULT_EXIT_BLUR,
  blurUnit: "px",
  enterEasing: "spring",
  springBounce: 0.25,
  exitEasing: easeOutStrong,
  layoutEasing: [0.175, 0.885, 0.32, 1],
  preserveMatching: true,
} as const satisfies GustMotionOptions;

export type GustConfig = {
  blur: boolean;
  duration: number;
  enterAngle: number;
  enterDuration: number;
  entranceBlur: number;
  entranceHeight: number;
  entranceOvershoot: number;
  entranceScale: number;
  enterStagger: number;
  exitDuration: number;
  exitAngle: number;
  exitBlur: number;
  exitHeight: number;
  exitScale: number;
  exitStagger: number;
  scale: boolean;
  enterDelay: number;
  exitDelay: number;
  staggerDirection: "forward" | "reverse";
  staggerMode: "fixed" | "bounded";
  staggerSpread: number;
  entranceStartScale: number;
  entranceScalePeak?: number;
  entranceOpacity: number;
  exitOpacity: number;
  entranceRotation: number;
  exitRotation: number;
  transformOrigin: "center" | "top" | "bottom";
  blurUnit: "px" | "em";
  enterEasing?: GustEasing | "spring";
  springBounce: number;
  exitEasing: GustEasing;
  layoutDuration?: number;
  layoutEasing: GustEasing;
  preserveMatching: boolean;
};

function nonnegative(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function fraction(value: number | undefined, fallback: number) {
  return Math.min(1, nonnegative(value, fallback));
}

function optionalFraction(value: number | undefined) {
  return value === undefined ? undefined : fraction(value, 0);
}

function angle(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function easing(value: GustEasing | undefined, fallback: GustEasing): GustEasing {
  if (value === undefined) return fallback;
  if (value === "linear" || value === "ease-out") return value;
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every(Number.isFinite) ||
    value[0] < 0 ||
    value[0] > 1 ||
    value[2] < 0 ||
    value[2] > 1
  ) {
    throw new RangeError(
      "Gust easing must be linear, ease-out, or a finite cubic Bézier with x coordinates between 0 and 1.",
    );
  }
  return value;
}

export function easingToCss(value: GustEasing) {
  return typeof value === "string" ? value : `cubic-bezier(${value.join(", ")})`;
}

export function resolveTransitionConfig(
  config: GustConfig,
  enteringCount: number,
  exitingCount: number,
): GustConfig {
  if (config.staggerMode === "fixed") return config;
  return {
    ...config,
    enterStagger:
      enteringCount > 0 ? (config.enterDuration * config.staggerSpread) / enteringCount : 0,
    exitStagger: exitingCount > 0 ? (config.exitDuration * config.staggerSpread) / exitingCount : 0,
  };
}

export function resolveLayoutDuration(config: GustConfig, entering: number, exiting: number) {
  if (config.layoutDuration !== undefined) return config.layoutDuration;
  config = resolveTransitionConfig(config, entering, exiting);
  if (entering > 0)
    return config.enterDelay + config.enterDuration + (entering - 1) * config.enterStagger;
  if (exiting > 0)
    return config.exitDelay + config.exitDuration + (exiting - 1) * config.exitStagger;
  return config.enterDuration;
}

export function resolveMotionOptions(input: GustMotionOptions = {}): GustConfig {
  const duration = nonnegative(input.duration, DEFAULT_DURATION_MS);
  const stagger = nonnegative(input.stagger, DEFAULT_STAGGER_MS);
  const scalePeak = optionalFraction(input.entranceScalePeak);

  return {
    blur: input.blur ?? true,
    duration,
    enterDuration: duration,
    exitDuration: nonnegative(input.exitDuration, DEFAULT_EXIT_DURATION_MS),
    enterAngle: angle(input.enterAngle, DEFAULT_ENTER_ANGLE),
    exitAngle: angle(input.exitAngle, DEFAULT_EXIT_ANGLE),
    entranceBlur: nonnegative(input.entranceBlur ?? input.entranceBlurCap, DEFAULT_ENTRANCE_BLUR),
    entranceHeight: nonnegative(
      input.entranceHeight ?? input.entranceOffset,
      DEFAULT_ENTRANCE_HEIGHT,
    ),
    entranceOvershoot: nonnegative(input.entranceOvershoot, DEFAULT_ENTRANCE_OVERSHOOT),
    entranceScale: Math.min(2, nonnegative(input.entranceScale, DEFAULT_ENTRANCE_SCALE)),
    exitBlur: nonnegative(input.exitBlur ?? input.exitBlurCap, DEFAULT_EXIT_BLUR),
    exitHeight: nonnegative(input.exitHeight, DEFAULT_EXIT_HEIGHT),
    exitScale: Math.min(1.5, nonnegative(input.exitScale, DEFAULT_EXIT_SCALE)),
    enterStagger: nonnegative(
      input.enterStagger,
      input.stagger === undefined ? DEFAULT_MOTION.enterStagger : stagger,
    ),
    exitStagger: nonnegative(
      input.exitStagger,
      input.stagger === undefined ? DEFAULT_MOTION.exitStagger : stagger,
    ),
    scale: input.scale ?? true,
    enterDelay: nonnegative(input.enterDelay, 0),
    exitDelay: nonnegative(input.exitDelay, 0),
    staggerDirection: input.staggerDirection ?? "forward",
    staggerMode: input.staggerMode ?? DEFAULT_MOTION.staggerMode,
    staggerSpread: Math.min(1.5, nonnegative(input.staggerSpread, DEFAULT_MOTION.staggerSpread)),
    entranceStartScale: Math.min(
      2,
      nonnegative(input.entranceStartScale, DEFAULT_MOTION.entranceStartScale),
    ),
    entranceScalePeak: Math.min(
      0.99,
      Math.max(0.01, scalePeak ?? DEFAULT_MOTION.entranceScalePeak),
    ),
    entranceOpacity: fraction(input.entranceOpacity, 0),
    exitOpacity: fraction(input.exitOpacity, 0),
    entranceRotation: angle(input.entranceRotation, 0),
    exitRotation: angle(input.exitRotation, 0),
    transformOrigin: input.transformOrigin ?? "center",
    blurUnit: input.blurUnit ?? "px",
    enterEasing:
      input.enterEasing === undefined || input.enterEasing === "spring"
        ? "spring"
        : easing(input.enterEasing, "ease-out"),
    springBounce: Math.min(0.8, Math.max(0.1, nonnegative(input.springBounce, 0.25))),
    exitEasing: easing(input.exitEasing, easeOutStrong),
    layoutDuration:
      input.layoutDuration === undefined ? undefined : nonnegative(input.layoutDuration, 0),
    layoutEasing: easing(input.layoutEasing, DEFAULT_MOTION.layoutEasing),
    preserveMatching: input.preserveMatching ?? input.preservePrefix ?? true,
  };
}

/** @deprecated Use resolveMotionOptions. */
export function resolveGustConfig(input: GustMotionOptions): GustConfig {
  return resolveMotionOptions(input);
}

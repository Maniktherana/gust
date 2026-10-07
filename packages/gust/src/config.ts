// Motion defaults and the resolved, clamped config the animation runs on.

export const DEFAULT_DURATION_MS = 440;
export const MAX_LAYOUT_DURATION_MS = 240;
export const DEFAULT_EXIT_DURATION_MS = 400;
export const DEFAULT_STAGGER_MS = 20;
export const DEFAULT_ENTER_ANGLE = -90;
export const DEFAULT_EXIT_ANGLE = -90;
export const DEFAULT_ENTRANCE_HEIGHT = 90;
export const DEFAULT_ENTRANCE_OVERSHOOT = 12;
export const DEFAULT_ENTRANCE_SCALE = 1.1;
export const DEFAULT_ENTRANCE_BLUR = 0;
export const DEFAULT_EXIT_HEIGHT = 90;
export const DEFAULT_EXIT_SCALE = 0.4;
export const DEFAULT_EXIT_BLUR = 4;
/** @deprecated Use DEFAULT_ENTRANCE_HEIGHT. */
export const DEFAULT_ENTRANCE_OFFSET = DEFAULT_ENTRANCE_HEIGHT;
/** @deprecated Use DEFAULT_ENTRANCE_BLUR. */
export const DEFAULT_ENTRANCE_BLUR_CAP = DEFAULT_ENTRANCE_BLUR;
/** @deprecated Use DEFAULT_EXIT_BLUR. */
export const DEFAULT_EXIT_BLUR_CAP = DEFAULT_EXIT_BLUR;

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
};

function clampMotionNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function resolveLayoutDuration(duration: number) {
  return Math.min(clampMotionNumber(duration, DEFAULT_DURATION_MS), MAX_LAYOUT_DURATION_MS);
}

function clampScale(value: number, fallback: number) {
  return Math.min(1.5, Math.max(0, clampMotionNumber(value, fallback)));
}

function clampPeakScale(value: number, fallback: number) {
  return Math.min(2, clampMotionNumber(value, fallback));
}

function normalizeAngle(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;

  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;

  return Object.is(normalized, -0) ? 0 : normalized;
}

export function resolveGustConfig(input: {
  blur: boolean;
  duration: number;
  enterAngle: number;
  entranceBlur?: number;
  entranceHeight?: number;
  entranceOvershoot?: number;
  /** @deprecated Use entranceBlur. */
  entranceBlurCap?: number;
  /** @deprecated Use entranceHeight. */
  entranceOffset?: number;
  entranceScale: number;
  exitDuration: number;
  exitAngle: number;
  exitBlur?: number;
  /** @deprecated Use exitBlur. */
  exitBlurCap?: number;
  exitHeight: number;
  exitScale: number;
  scale: boolean;
  stagger: number;
}): GustConfig {
  const resolvedDuration = clampMotionNumber(input.duration, DEFAULT_DURATION_MS);
  const resolvedStagger = clampMotionNumber(input.stagger, DEFAULT_STAGGER_MS);

  return {
    blur: input.blur,
    duration: resolvedDuration,
    enterAngle: normalizeAngle(input.enterAngle, DEFAULT_ENTER_ANGLE),
    enterDuration: resolvedDuration,
    entranceBlur: clampMotionNumber(
      input.entranceBlur ?? input.entranceBlurCap ?? DEFAULT_ENTRANCE_BLUR,
      DEFAULT_ENTRANCE_BLUR,
    ),
    entranceHeight: clampMotionNumber(
      input.entranceHeight ?? input.entranceOffset ?? DEFAULT_ENTRANCE_HEIGHT,
      DEFAULT_ENTRANCE_HEIGHT,
    ),
    entranceOvershoot: clampMotionNumber(
      input.entranceOvershoot ?? DEFAULT_ENTRANCE_OVERSHOOT,
      DEFAULT_ENTRANCE_OVERSHOOT,
    ),
    entranceScale: clampPeakScale(input.entranceScale, DEFAULT_ENTRANCE_SCALE),
    enterStagger: resolvedStagger,
    exitDuration: clampMotionNumber(input.exitDuration, DEFAULT_EXIT_DURATION_MS),
    exitAngle: normalizeAngle(input.exitAngle, DEFAULT_EXIT_ANGLE),
    exitBlur: clampMotionNumber(
      input.exitBlur ?? input.exitBlurCap ?? DEFAULT_EXIT_BLUR,
      DEFAULT_EXIT_BLUR,
    ),
    exitHeight: clampMotionNumber(input.exitHeight, DEFAULT_EXIT_HEIGHT),
    exitScale: clampScale(input.exitScale, DEFAULT_EXIT_SCALE),
    exitStagger: resolvedStagger,
    scale: input.scale,
  };
}

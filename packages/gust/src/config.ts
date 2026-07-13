// Motion defaults and the resolved, clamped config the animation runs on.

export const WORD_HOLD_MS = 1600;
export const DEFAULT_DURATION_MS = 440;
export const DEFAULT_EXIT_DURATION_MS = 360;
export const DEFAULT_STAGGER_MS = 12;
export const DEFAULT_ENTRANCE_OFFSET = 72;
export const DEFAULT_ENTRANCE_HEIGHT = 8;
export const DEFAULT_ENTRANCE_SCALE = 1.1;
export const DEFAULT_EXIT_HEIGHT = 90;
export const DEFAULT_EXIT_SCALE = 0.4;

export type GustConfig = {
  blur: boolean;
  duration: number;
  enterDuration: number;
  entranceHeight: number;
  entranceScale: number;
  enterStagger: number;
  exitDuration: number;
  exitHeight: number;
  exitScale: number;
  exitStagger: number;
  scale: boolean;
};

function clampMotionNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function clampScale(value: number, fallback: number) {
  return Math.min(1.5, Math.max(0, clampMotionNumber(value, fallback)));
}

function clampPeakScale(value: number, fallback: number) {
  return Math.min(2, Math.max(1, clampMotionNumber(value, fallback)));
}

export function resolveGustConfig(input: {
  blur: boolean;
  duration: number;
  entranceHeight: number;
  entranceScale: number;
  exitDuration: number;
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
    enterDuration: resolvedDuration,
    entranceHeight: clampMotionNumber(input.entranceHeight, DEFAULT_ENTRANCE_HEIGHT),
    entranceScale: clampPeakScale(input.entranceScale, DEFAULT_ENTRANCE_SCALE),
    enterStagger: resolvedStagger,
    exitDuration: clampMotionNumber(input.exitDuration, DEFAULT_EXIT_DURATION_MS),
    exitHeight: clampMotionNumber(input.exitHeight, DEFAULT_EXIT_HEIGHT),
    exitScale: clampScale(input.exitScale, DEFAULT_EXIT_SCALE),
    exitStagger: resolvedStagger,
    scale: input.scale,
  };
}

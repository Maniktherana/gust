// Bakes Motion-style per-property variant timing into Web Animations API
// keyframes. Each property keeps its own duration and easing (opacity lands
// early while travel/scale share the base window). All tracks are
// sampled at a shared set of offsets so a single WAAPI animation reproduces the
// exact per-property curve.

import { clamp01, cubicBezier, easeOutStrongFn, lerp } from "./easing";
import { DEFAULT_ENTRANCE_OFFSET, type GustConfig } from "./config";
import { isWhitespaceCharacter, splitGraphemes } from "./characters";

const ENTER_SAMPLE_COUNT = 40;
const EXIT_SAMPLE_COUNT = 28;
const entranceEaseX1 = 0.34;
const entranceEaseX2 = 0.64;

// A single property's keyframe track, evaluated by sampling. `times` are in
// [0, 1] and `ease` is applied per-segment, matching how Motion eases between
// keyframe array entries.
type MotionTrack = {
  duration: number;
  ease: (value: number) => number;
  times: number[];
  values: number[];
};

export type GustKeyframes = {
  duration: number;
  keyframes: Keyframe[];
};

function evalTrack(track: MotionTrack, globalTime: number) {
  const { ease, times, values } = track;

  if (values.length === 1) return values[0];

  const localProgress = clamp01(track.duration > 0 ? globalTime / track.duration : 1);
  let segment = 0;

  while (segment < times.length - 2 && localProgress > times[segment + 1]) {
    segment += 1;
  }

  const span = times[segment + 1] - times[segment] || 1;
  const segmentFraction = clamp01((localProgress - times[segment]) / span);

  return lerp(values[segment], values[segment + 1], ease(segmentFraction));
}

// The entrance gets its bounce from an overshooting bezier; solve that curve so
// entranceHeight maps to the actual above-baseline peak instead of a held keyframe.
function cubicBezierCoordinate(t: number, point1: number, point2: number) {
  const invertedT = 1 - t;

  return 3 * invertedT * invertedT * t * point1 + 3 * invertedT * t * t * point2 + t * t * t;
}

function overshootForControlPoint(controlY1: number) {
  if (controlY1 <= 1) return 0;

  const peakT = controlY1 / (3 * controlY1 - 2);
  return cubicBezierCoordinate(peakT, controlY1, 1) - 1;
}

function entranceControlY1(height: number) {
  const targetOvershoot = Math.max(0, height / DEFAULT_ENTRANCE_OFFSET);

  if (targetOvershoot <= 0) return 1;

  let low = 1;
  let high = 2;

  while (overshootForControlPoint(high) < targetOvershoot && high < 8) {
    high *= 2;
  }

  for (let index = 0; index < 20; index += 1) {
    const middle = (low + high) / 2;

    if (overshootForControlPoint(middle) < targetOvershoot) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return high;
}

function entrancePeakTime(controlY1: number) {
  if (controlY1 <= 1) return 0.68;

  const peakT = controlY1 / (3 * controlY1 - 2);

  return cubicBezierCoordinate(peakT, entranceEaseX1, entranceEaseX2);
}

function entranceTiming(height: number) {
  const controlY1 = entranceControlY1(height);

  return {
    ease: height > 0 ? cubicBezier(entranceEaseX1, controlY1, entranceEaseX2, 1) : easeOutStrongFn,
    peakTime: entrancePeakTime(controlY1),
  };
}

function directionalTranslate(distance: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * (distance / 100);
  const y = Math.sin(radians) * (distance / 100);
  const clean = (value: number) => (Math.abs(value) < 0.0001 ? 0 : Number(value.toFixed(4)));

  return `translate(${clean(x)}em, ${clean(y)}em)`;
}

export function characterTransitionWindow(
  text: string,
  duration: number,
  stagger: number,
  firstAnimatedIndex = 0,
) {
  const animatedCount = splitGraphemes(text)
    .slice(firstAnimatedIndex)
    .filter((character) => !isWhitespaceCharacter(character)).length;

  if (animatedCount === 0) return 0;

  return duration + Math.max(animatedCount - 1, 0) * stagger;
}

export function lastCharacterStartDelay(text: string, stagger: number, firstAnimatedIndex = 0) {
  const animatedCount = splitGraphemes(text)
    .slice(firstAnimatedIndex)
    .filter((character) => !isWhitespaceCharacter(character)).length;

  return Math.max(0, animatedCount - 1) * stagger;
}

export function buildEnterKeyframes(config: GustConfig): GustKeyframes {
  const enter = config.enterDuration;
  const timing = entranceTiming(config.entranceHeight);
  const peakScale = config.scale ? config.entranceScale : 1;
  const revealEndTime = Math.min(0.32, Math.max(0.18, timing.peakTime / 2));
  const opacityTrack: MotionTrack = {
    duration: enter * revealEndTime,
    ease: easeOutStrongFn,
    times: [0, 1],
    values: [0, 1],
  };
  const distanceTrack: MotionTrack = {
    duration: enter,
    ease: timing.ease,
    times: [0, 1],
    values: [DEFAULT_ENTRANCE_OFFSET, 0],
  };
  const scaleTrack: MotionTrack = {
    duration: enter,
    ease: easeOutStrongFn,
    times: [0, revealEndTime, timing.peakTime, 1],
    values: [1, 1, peakScale, 1],
  };
  const maxDuration = enter;
  const keyframes: Keyframe[] = [];

  for (let index = 0; index < ENTER_SAMPLE_COUNT; index += 1) {
    const offset = index / (ENTER_SAMPLE_COUNT - 1);
    const globalTime = offset * maxDuration;

    keyframes.push({
      easing: "linear",
      offset,
      opacity: evalTrack(opacityTrack, globalTime),
      transform: `${directionalTranslate(-evalTrack(distanceTrack, globalTime), config.enterAngle)} scale(${evalTrack(scaleTrack, globalTime)})`,
    });
  }

  return { duration: maxDuration, keyframes };
}

export function buildExitKeyframes(config: GustConfig): GustKeyframes {
  const exit = config.exitDuration;
  const exitScale = config.scale ? config.exitScale : 1;
  const opacityTrack: MotionTrack = {
    duration: exit,
    ease: easeOutStrongFn,
    times: [0, 1],
    values: [1, 0],
  };
  const distanceTrack: MotionTrack = {
    duration: exit,
    ease: easeOutStrongFn,
    times: [0, 1],
    values: [0, config.exitHeight],
  };
  const scaleTrack: MotionTrack = {
    duration: exit,
    ease: easeOutStrongFn,
    times: [0, 1],
    values: [1, exitScale],
  };
  const filterTrack: MotionTrack | null =
    config.blur && config.exitBlurCap > 0
      ? {
          duration: exit * 0.95,
          ease: easeOutStrongFn,
          times: [0, 1],
          values: [0, config.exitBlurCap],
        }
      : null;
  const keyframes: Keyframe[] = [];

  for (let index = 0; index < EXIT_SAMPLE_COUNT; index += 1) {
    const offset = index / (EXIT_SAMPLE_COUNT - 1);
    const globalTime = offset * exit;

    const keyframe: Keyframe = {
      easing: "linear",
      offset,
      opacity: evalTrack(opacityTrack, globalTime),
      transform: `${directionalTranslate(evalTrack(distanceTrack, globalTime), config.exitAngle)} scale(${evalTrack(scaleTrack, globalTime)})`,
    };

    if (filterTrack) keyframe.filter = `blur(${evalTrack(filterTrack, globalTime)}px)`;

    keyframes.push(keyframe);
  }

  return { duration: exit, keyframes };
}

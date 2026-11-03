import { spring } from "motion";
import { clamp01, cubicBezier, lerp } from "./easing";
import type { GustConfig, GustEasing } from "./config";
import { isWhitespaceCharacter, splitGraphemes } from "./characters";

function easingFunction(easing: GustEasing) {
  if (easing === "linear") return (progress: number) => progress;
  if (easing === "ease-out") return cubicBezier(0, 0, 0.58, 1);
  return cubicBezier(...easing);
}

export type GustKeyframes = { duration: number; keyframes: Keyframe[] };
const leadIns = new WeakMap<GustKeyframes, Map<number, GustKeyframes>>();
// Hold inside the keyframes, rather than WAAPI delay: Safari can skip delayed
// animations' first painted frames on an otherwise quiet page.
export function withLeadIn(motion: GustKeyframes, delay: number): GustKeyframes {
  if (!(delay > 0) || !motion.keyframes.length) return motion;
  let cached = leadIns.get(motion);
  if (!cached) leadIns.set(motion, (cached = new Map()));
  const hit = cached.get(delay);
  if (hit) return hit;
  const duration = delay + motion.duration;
  const last = motion.keyframes.length - 1;
  const keyframes = [
    { ...motion.keyframes[0], offset: 0 },
    ...motion.keyframes.map((keyframe, index) => {
      const offset = typeof keyframe.offset === "number" ? keyframe.offset : index / (last || 1);
      return { ...keyframe, offset: (delay + offset * motion.duration) / duration };
    }),
  ];
  const leadIn = { duration, keyframes };
  cached.set(delay, leadIn);
  return leadIn;
}

function directionalTranslate(distance: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * (distance / 100);
  const y = Math.sin(radians) * (distance / 100);
  const clean = (value: number) => (Math.abs(value) < 0.000001 ? 0 : Number(value.toFixed(6)));
  return `translate(${clean(x)}em, ${clean(y)}em)`;
}

export function characterTransitionWindow(
  text: string,
  duration: number,
  stagger: number,
  firstAnimatedIndex = 0,
) {
  const count = splitGraphemes(text)
    .slice(firstAnimatedIndex)
    .filter((character) => !isWhitespaceCharacter(character)).length;
  return count ? duration + Math.max(count - 1, 0) * stagger : 0;
}

export function lastCharacterStartDelay(text: string, stagger: number, firstAnimatedIndex = 0) {
  const count = splitGraphemes(text)
    .slice(firstAnimatedIndex)
    .filter((character) => !isWhitespaceCharacter(character)).length;
  return Math.max(count - 1, 0) * stagger;
}

function entranceFrame(config: GustConfig, offset: number, progress: number): Keyframe {
  const peak = config.entranceScalePeak ?? 0.65;
  const arriving = progress <= peak;
  const phase = arriving ? progress / peak : (progress - peak) / (1 - peak);
  const distance = arriving
    ? lerp(-config.entranceHeight, config.entranceOvershoot, phase)
    : lerp(config.entranceOvershoot, 0, phase);
  const scale = !config.scale
    ? 1
    : arriving
      ? lerp(config.entranceStartScale, config.entranceScale, phase)
      : lerp(config.entranceScale, 1, phase);
  const frame: Keyframe = {
    offset,
    easing: "linear",
    transform: `${directionalTranslate(distance, config.enterAngle)} scale(${scale})`,
    opacity: lerp(config.entranceOpacity, 1, progress),
  };
  if (config.blur && config.entranceBlur > 0)
    frame.filter = `blur(${config.entranceBlur * (1 - progress)}${config.blurUnit})`;
  if (config.entranceRotation)
    frame.transform += ` rotate(${config.entranceRotation * (1 - progress)}deg)`;
  return frame;
}

function springEntrance(config: GustConfig): GustKeyframes {
  const generator = spring({
    keyframes: [0, 1],
    duration: Math.max(1, config.enterDuration),
    bounce: config.springBounce,
  });
  const samples = Array.from(
    { length: 121 },
    (_, index) => generator.next((index / 120) * Math.max(1, config.enterDuration)).value,
  );
  let peakIndex = 0;
  const distance = [0];
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index] > samples[peakIndex]) peakIndex = index;
    distance.push(distance[index - 1] + Math.abs(samples[index] - samples[index - 1]));
  }
  const peak = samples[peakIndex];
  const returning = peak > 1;
  const keyframes = samples.map((value, index): Keyframe => {
    const offset = index / 120;
    const beforePeak = index <= peakIndex;
    const phase = beforePeak ? value / peak : (peak - value) / (peak - 1);
    const travel = returning
      ? beforePeak
        ? lerp(-config.entranceHeight, config.entranceOvershoot, phase)
        : lerp(config.entranceOvershoot, 0, phase)
      : lerp(-config.entranceHeight, 0, value);
    const scale = !config.scale
      ? 1
      : returning
        ? beforePeak
          ? lerp(config.entranceStartScale, config.entranceScale, phase)
          : lerp(config.entranceScale, 1, phase)
        : lerp(config.entranceStartScale, 1, value);
    const visibility = distance[index] / distance[120];
    const frame: Keyframe = {
      offset,
      easing: "linear",
      transform: `${directionalTranslate(travel, config.enterAngle)} scale(${scale})`,
      opacity: lerp(config.entranceOpacity, 1, visibility),
    };
    if (config.blur && config.entranceBlur > 0)
      frame.filter = `blur(${config.entranceBlur * (1 - visibility)}${config.blurUnit})`;
    if (config.entranceRotation)
      frame.transform += ` rotate(${config.entranceRotation * (1 - visibility)}deg)`;
    return frame;
  });
  return { duration: config.enterDuration, keyframes };
}

export function buildEnterKeyframes(config: GustConfig): GustKeyframes {
  if (config.enterDuration === 0) {
    return { duration: 0, keyframes: [entranceFrame(config, 0, 0), entranceFrame(config, 1, 1)] };
  }
  if (config.enterEasing === "spring") return springEntrance(config);
  const ease = easingFunction(config.enterEasing ?? "ease-out");
  const peak = config.entranceScalePeak ?? 0.65;
  const frames = Array.from({ length: 61 }, (_, index) => {
    const offset = index / 60;
    return entranceFrame(config, offset, clamp01(ease(offset)));
  });
  // Include the actual peak so sampling cannot shave off an authored scale/overshoot target.
  let lower = 0;
  let upper = 1;
  for (let index = 0; index < 40; index += 1) {
    const middle = (lower + upper) / 2;
    if (ease(middle) < peak) lower = middle;
    else upper = middle;
  }
  frames.push(entranceFrame(config, (lower + upper) / 2, peak));
  frames.sort((a, b) => Number(a.offset) - Number(b.offset));
  return { duration: config.enterDuration, keyframes: frames };
}

export function buildExitKeyframes(config: GustConfig): GustKeyframes {
  const ease = easingFunction(config.exitEasing);
  const keyframes = Array.from({ length: 61 }, (_, index): Keyframe => {
    const offset = index / 60;
    const progress = clamp01(ease(offset));
    const frame: Keyframe = {
      offset,
      easing: "linear",
      transform: `${directionalTranslate(config.exitHeight * progress, config.exitAngle)} scale(${config.scale ? lerp(1, config.exitScale, progress) : 1})`,
      opacity: lerp(1, config.exitOpacity, progress),
    };
    if (config.blur && config.exitBlur > 0)
      frame.filter = `blur(${config.exitBlur * progress}${config.blurUnit})`;
    if (config.exitRotation) frame.transform += ` rotate(${config.exitRotation * progress}deg)`;
    return frame;
  });
  return { duration: config.exitDuration, keyframes };
}

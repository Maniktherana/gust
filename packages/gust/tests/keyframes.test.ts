import { expect, test } from "bun:test";

import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  resolveGustConfig,
} from "../src/config";
import { buildEnterKeyframes, buildExitKeyframes, withLeadIn } from "../src/keyframes";

// The keyframe at or just before `offset`, which is what a linear animation shows between
// samples as precise as these.
function at(keyframes: Keyframe[], offset: number) {
  let found = keyframes[0]!;
  for (const keyframe of keyframes) {
    if (Number(keyframe.offset) <= offset + 1e-9) found = keyframe;
  }
  return found;
}

// A character's stagger lives in its keyframes rather than the animation's delay, so the
// animation runs from its first frame. It must still show exactly the original motion, late.
test("a lead-in holds the first frame, then plays the original motion late", () => {
  const config = resolveGustConfig({
    blur: true,
    duration: DEFAULT_DURATION_MS,
    enterAngle: DEFAULT_ENTER_ANGLE,
    exitAngle: DEFAULT_EXIT_ANGLE,
    entranceScale: DEFAULT_ENTRANCE_SCALE,
    exitDuration: DEFAULT_EXIT_DURATION_MS,
    exitHeight: DEFAULT_EXIT_HEIGHT,
    exitScale: DEFAULT_EXIT_SCALE,
    scale: true,
    stagger: DEFAULT_STAGGER_MS,
  });
  for (const motion of [buildEnterKeyframes(config), buildExitKeyframes(config)]) {
    const delay = 60;
    const late = withLeadIn(motion, delay);
    expect(late.duration).toBe(motion.duration + delay);
    expect(late.keyframes[0]!.offset).toBe(0);
    expect(late.keyframes.at(-1)!.offset).toBeCloseTo(1, 9);
    const { offset: _first, ...first } = motion.keyframes[0]!;
    for (const time of [0, delay / 2, delay - 1]) {
      const { offset: _held, ...held } = at(late.keyframes, time / late.duration);
      expect(held).toEqual(first);
    }
    for (const keyframe of motion.keyframes) {
      const time = delay + Number(keyframe.offset) * motion.duration;
      const { offset: _shown, ...shown } = at(late.keyframes, time / late.duration);
      const { offset: _original, ...original } = keyframe;
      expect(shown).toEqual(original);
    }
    expect(withLeadIn(motion, 0)).toBe(motion);
    expect(withLeadIn(motion, delay)).toBe(late);
  }
});

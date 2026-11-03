import { useDialKit } from "dialkit";
import { DEFAULT_MOTION, resolveMotionOptions, type GustMotionOptions } from "@maniktherana/gust";

export type DemoMotion = GustMotionOptions;

// The existing development DialRoot renders these panels; production uses
// the same defaults through the site's DialKit adapter.
export function useDemoMotion(
  title: string,
  id: string,
  tuned: DemoMotion = DEFAULT_MOTION,
  kind: "demo" | "example" = "demo",
): DemoMotion {
  const start = { ...DEFAULT_MOTION, ...tuned };
  const resolved = resolveMotionOptions(start);
  const controls = useDialKit(
    `${title} ${kind}`,
    {
      timing: {
        bounded: resolved.staggerMode === "bounded",
        staggerSpread: [resolved.staggerSpread * 100, 0, 150, 1],
        duration: [start.duration, 0, 1200, 10],
        exitDuration: [start.exitDuration, 0, 1200, 10],
        enterStagger: [resolved.enterStagger, 0, 80, 1],
        exitStagger: [resolved.exitStagger, 0, 80, 1],
      },
      entrance: {
        height: [start.entranceHeight, 0, 200, 1],
        overshoot: [start.entranceOvershoot, 0, 120, 1],
        scale: [start.entranceScale, 0, 2, 0.01],
        blur: [start.entranceBlur, 0, 12, 0.25],
      },
      exit: {
        height: [start.exitHeight, 0, 200, 1],
        scale: [start.exitScale, 0, 1.5, 0.01],
        blur: [start.exitBlur, 0, 12, 0.25],
      },
      direction: {
        customAngles: false,
        enterAngle: [start.enterAngle, -180, 180, 1],
        exitAngle: [start.exitAngle, -180, 180, 1],
        down: start.enterAngle === 90 && start.exitAngle === 90,
      },
      effects: {
        blur: start.blur,
        scale: start.scale,
        preserveMatching: start.preserveMatching ?? start.preservePrefix,
      },
    },
    { id: `gust-${kind}:v4:${id}` },
  );

  return {
    ...start,
    blur: controls.effects.blur,
    duration: controls.timing.duration,
    enterAngle: controls.direction.customAngles
      ? controls.direction.enterAngle
      : controls.direction.down
        ? 90
        : start.enterAngle,
    entranceBlur: controls.entrance.blur,
    entranceOvershoot: controls.entrance.overshoot,
    entranceHeight: controls.entrance.height,
    entranceScale: controls.entrance.scale,
    exitAngle: controls.direction.customAngles
      ? controls.direction.exitAngle
      : controls.direction.down
        ? 90
        : start.exitAngle,
    exitBlur: controls.exit.blur,
    exitDuration: controls.timing.exitDuration,
    exitHeight: controls.exit.height,
    exitScale: controls.exit.scale,
    preserveMatching: controls.effects.preserveMatching,
    scale: controls.effects.scale,
    staggerMode: controls.timing.bounded ? "bounded" : "fixed",
    staggerSpread: controls.timing.staggerSpread / 100,
    enterStagger: controls.timing.enterStagger,
    exitStagger: controls.timing.exitStagger,
  };
}

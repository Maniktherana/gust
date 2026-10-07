import { useDialKit } from "dialkit";
import type { GustProps } from "@maniktherana/gust";

import { defaultMotion } from "@/lib/gust-motion";

export type DemoMotion = Omit<GustProps, "value">;

// The existing development DialRoot renders these panels; production uses
// the same defaults through the site's DialKit adapter.
export function useDemoMotion(
  title: string,
  id: string,
  tuned: DemoMotion,
  kind: "demo" | "example" = "demo",
): DemoMotion {
  const start = { ...defaultMotion, ...tuned };
  const controls = useDialKit(
    `${title} ${kind}`,
    {
      timing: {
        duration: [start.duration, 0, 1200, 10],
        exitDuration: [start.exitDuration, 0, 1200, 10],
        stagger: [start.stagger, 0, 80, 1],
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
        down: start.down ?? false,
      },
      effects: {
        blur: start.blur,
        scale: start.scale,
        preservePrefix: start.preservePrefix,
      },
    },
    { id: `gust-${kind}:v2:${id}` },
  );

  return {
    blur: controls.effects.blur,
    duration: controls.timing.duration,
    down: controls.direction.down ? true : undefined,
    enterAngle: controls.direction.customAngles ? controls.direction.enterAngle : undefined,
    entranceBlur: controls.entrance.blur,
    entranceOvershoot: controls.entrance.overshoot,
    entranceHeight: controls.entrance.height,
    entranceScale: controls.entrance.scale,
    exitAngle: controls.direction.customAngles ? controls.direction.exitAngle : undefined,
    exitBlur: controls.exit.blur,
    exitDuration: controls.timing.exitDuration,
    exitHeight: controls.exit.height,
    exitScale: controls.exit.scale,
    preservePrefix: controls.effects.preservePrefix,
    scale: controls.effects.scale,
    stagger: controls.timing.stagger,
  };
}

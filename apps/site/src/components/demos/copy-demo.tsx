import { CopyButton } from "@/components/copy-button";
import { useDialKit } from "dialkit";

export function CopyDemo() {
  const controls = useDialKit(
    "Copy demo",
    {
      timing: {
        duration: [440, 0, 1200, 10],
        exitDuration: [360, 0, 1200, 10],
        stagger: [40, 0, 80, 1],
      },
      entrance: {
        height: [0, 0, 120, 1],
        scale: [1, 1, 2, 0.01],
      },
      exit: {
        blurCap: [4, 0, 12, 0.25],
        height: [100, 0, 200, 1],
        scale: [0.6, 0, 1.5, 0.01],
      },
      effects: {
        blur: false,
        scale: true,
        preservePrefix: true,
      },
    },
    { id: "gust-demo:copy" },
  );

  return (
    <CopyButton
      value="Gust copied this text"
      variant="outline"
      resetAfter={1800}
      gustProps={{
        blur: controls.effects.blur,
        duration: controls.timing.duration,
        entranceHeight: controls.entrance.height,
        entranceScale: controls.entrance.scale,
        exitDuration: controls.timing.exitDuration,
        exitBlurCap: controls.exit.blurCap,
        exitHeight: controls.exit.height,
        exitScale: controls.exit.scale,
        preservePrefix: controls.effects.preservePrefix,
        scale: controls.effects.scale,
        stagger: controls.timing.stagger,
      }}
    />
  );
}

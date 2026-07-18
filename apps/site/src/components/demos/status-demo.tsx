import * as React from "react";
import { useDialKit } from "dialkit";

import { IconArrowRotateAnticlockwise, IconBadgeCheck } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Gust } from "@maniktherana/gust";

const glyphVisible = "scale-100 opacity-100 blur-none";
const glyphHidden = "scale-25 opacity-0 blur-[4px]";
const glyphTransition =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

const deploySteps = [
  { colorClassName: "text-muted-foreground", key: "queued", label: "Queued" },
  { colorClassName: "text-warn", key: "building", label: "Building" },
  { colorClassName: "text-info", key: "deploying", label: "Deploying" },
  { colorClassName: "text-ok", key: "live", label: "Live" },
] as const;

function StatusGlyph({ children, shown }: { children: React.ReactNode; shown: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "col-start-1 row-start-1 grid place-items-center",
        glyphTransition,
        shown ? glyphVisible : glyphHidden,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDemo() {
  const controls = useDialKit(
    "Status demo",
    {
      timing: {
        duration: [440, 0, 1200, 10],
        exitDuration: [440, 0, 1200, 10],
        stagger: [20, 0, 80, 1],
      },
      entrance: {
        height: [10, 0, 120, 1],
        offset: [90, 0, 200, 1],
        scale: [1.15, 1, 2, 0.01],
      },
      exit: {
        blurCap: [4, 0, 12, 0.25],
        height: [120, 0, 200, 1],
        scale: [0.4, 0, 1.5, 0.01],
      },
      effects: {
        blur: true,
        scale: true,
        preservePrefix: true,
      },
    },
    { id: "gust-demo:status" },
  );
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % deploySteps.length);
    }, 2100);

    return () => window.clearInterval(timer);
  }, []);

  const active = deploySteps[step];

  return (
    <span className="flex items-center gap-2.5 rounded-full bg-field px-4 py-1.5 shadow-[var(--shadow-highlight)]">
      <span
        className={cn(
          "grid size-5 place-items-center transition-colors duration-500",
          active.colorClassName,
        )}
      >
        <StatusGlyph shown={active.key === "queued"}>
          <span className="size-4 animate-pulse rounded-full border-[2px] border-current" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "building"}>
          <IconArrowRotateAnticlockwise className="size-[18px] animate-spin [animation-direction:reverse]" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "deploying"}>
          <span className="relative grid place-items-center">
            <span className="absolute size-5 rounded-full border-[1.5px] border-current opacity-0 motion-safe:animate-[liveline-pulse_1000ms_linear_infinite]" />
            <span className="relative size-2.5 rounded-full bg-current" />
          </span>
        </StatusGlyph>
        <StatusGlyph shown={active.key === "live"}>
          <IconBadgeCheck className="size-5" />
        </StatusGlyph>
      </span>
      <Gust
        value={active.label}
        duration={controls.timing.duration}
        exitDuration={controls.timing.exitDuration}
        stagger={controls.timing.stagger}
        entranceHeight={controls.entrance.height}
        entranceOffset={controls.entrance.offset}
        entranceScale={controls.entrance.scale}
        exitBlurCap={controls.exit.blurCap}
        exitHeight={controls.exit.height}
        exitScale={controls.exit.scale}
        blur={controls.effects.blur}
        scale={controls.effects.scale}
        preservePrefix={controls.effects.preservePrefix}
        className={cn("text-xl font-semibold", active.colorClassName)}
      />
    </span>
  );
}

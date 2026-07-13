import * as React from "react";

import { IconArrowRotateAnticlockwise, IconBadgeCheck } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Gust } from "@gust/core";

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
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % deploySteps.length);
    }, 2100);

    return () => window.clearInterval(timer);
  }, []);

  const active = deploySteps[step];

  return (
    <span className="flex h-8 items-center gap-2 rounded-full border border-border bg-field pr-3.5 pl-3 shadow-[var(--shadow-highlight)]">
      <span
        className={cn(
          "grid size-4 place-items-center transition-colors duration-500",
          active.colorClassName,
        )}
      >
        <StatusGlyph shown={active.key === "queued"}>
          <span className="size-3 animate-pulse rounded-full border-[1.5px] border-current" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "building"}>
          <IconArrowRotateAnticlockwise className="size-3.5 animate-spin [animation-direction:reverse]" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "deploying"}>
          <span className="relative grid place-items-center">
            <span className="absolute size-[18px] rounded-full border-[1.5px] border-current opacity-0 motion-safe:animate-[liveline-pulse_1500ms_linear_infinite]" />
            <span className="relative size-2 rounded-full bg-current" />
          </span>
        </StatusGlyph>
        <StatusGlyph shown={active.key === "live"}>
          <IconBadgeCheck className="size-4" />
        </StatusGlyph>
      </span>
      <Gust text={active.label} className={cn("text-sm font-medium", active.colorClassName)} />
    </span>
  );
}

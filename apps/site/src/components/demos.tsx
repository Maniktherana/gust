import * as React from "react";

import { DemoCopyButton } from "@/components/demo-copy-button";
import { CopyDemo, copyMotion } from "@/components/demos/copy-demo";
import copySource from "@/components/demos/copy-demo.tsx?raw";
import { HeadlineDemo } from "@/components/demos/headline-demo";
import headlineSource from "@/components/demos/headline-demo.tsx?raw";
import { OtpDemo, otpMotion } from "@/components/demos/otp-demo";
import otpSource from "@/components/demos/otp-demo.tsx?raw";
import { StatusDemo, statusMotion } from "@/components/demos/status-demo";
import statusSource from "@/components/demos/status-demo.tsx?raw";
import { examples } from "@/components/examples";
import { ExampleCard } from "@/components/examples/example-card";
import { useInView } from "@/hooks/use-element";
import { useDemoMotion } from "@/hooks/use-demo-motion";
import { componentPrompt } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import type { GustProps } from "@maniktherana/gust";

type Motion = Omit<GustProps, "value">;

export const headlinePrompt = componentPrompt({
  source: headlineSource,
  title: "cycling headline",
});

export function HeadlineBox({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const paused = !inView;

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Headline"
      className={cn(
        "relative h-48 overflow-hidden rounded-xl bg-surface-raised sm:h-56",
        className,
      )}
    >
      <DemoCopyButton prompt={headlinePrompt} title="Headline" />
      <HeadlineDemo paused={paused} />
    </div>
  );
}

export const demos = [
  {
    id: "status",
    motion: statusMotion,
    padded: true,
    render: (motion: Motion, paused: boolean) => <StatusDemo motion={motion} paused={paused} />,
    source: statusSource,
    title: "Status",
  },
  {
    id: "copy",
    motion: copyMotion,
    padded: true,
    render: (motion: Motion, paused: boolean) => <CopyDemo motion={motion} paused={paused} />,
    source: copySource,
    title: "Copy",
  },
  {
    id: "otp",
    motion: otpMotion,
    padded: true,
    render: (motion: Motion, paused: boolean) => <OtpDemo motion={motion} paused={paused} />,
    source: otpSource,
    title: "One-time code",
  },
].map((demo) => ({
  ...demo,
  prompt: componentPrompt({
    source: demo.source,
    title: `${demo.title} demo`,
  }),
}));

export function DemoBox({ demo, className }: { demo: (typeof demos)[number]; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const paused = !inView;
  const motion = useDemoMotion(demo.title, demo.id, demo.motion);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={demo.title}
      className={cn(
        "relative grid h-48 place-items-center overflow-hidden rounded-xl bg-surface-raised",
        demo.padded && "px-6",
        className,
      )}
    >
      <DemoCopyButton prompt={demo.prompt} title={demo.title} />
      {demo.render(motion, paused)}
    </div>
  );
}

export function DemoGrid() {
  return (
    <section aria-label="Gust demos" className="grid grid-cols-2 gap-3">
      <HeadlineBox className="col-span-2 h-48 sm:col-span-1 sm:h-56" />
      {examples.filter((example) => example.id === "live-price").map((example) => (
        <ExampleCard key={example.id} example={example} className="col-span-2 h-48 sm:col-span-1 sm:h-56" />
      ))}
      {demos
        .filter((demo) => demo.id !== "otp")
        .map((demo) => (
          <DemoBox key={demo.id} demo={demo} className="h-36 px-3 sm:h-40" />
        ))}
    </section>
  );
}

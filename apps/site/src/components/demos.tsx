import * as React from "react";

import { CopyDemo } from "@/components/demos/copy-demo";
import { HeadlineDemo } from "@/components/demos/headline-demo";
import { OtpDemo } from "@/components/demos/otp-demo";
import { StatusDemo } from "@/components/demos/status-demo";
import { examples } from "@/components/examples";
import { ExampleCard } from "@/components/examples/example-card";
import { useInView } from "@/hooks/use-element";
import { useDemoMotion } from "@/hooks/use-demo-motion";
import { componentPrompt } from "@/lib/prompts";
import { getExampleSource } from "@/lib/example-sources";
import { cn } from "@/lib/utils";
import { DEFAULT_MOTION, type GustMotionOptions } from "@maniktherana/gust";

type Motion = GustMotionOptions;

export const headlinePrompt = componentPrompt({
  source: getExampleSource("headline"),
  title: "Headline",
});

export function HeadlineBox({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
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
      {children}
      <HeadlineDemo paused={paused} />
    </div>
  );
}

export const demos = [
  {
    id: "status",
    motion: DEFAULT_MOTION,
    padded: true,
    render: (motion: Motion, paused: boolean) => <StatusDemo motion={motion} paused={paused} />,
    title: "Status",
  },
  {
    id: "copy",
    motion: DEFAULT_MOTION,
    padded: true,
    render: (motion: Motion, paused: boolean) => <CopyDemo motion={motion} paused={paused} />,
    title: "Copy",
  },
  {
    id: "otp",
    motion: DEFAULT_MOTION,
    padded: true,
    render: (motion: Motion, paused: boolean) => <OtpDemo motion={motion} paused={paused} />,
    title: "One-time code",
  },
].map((demo) => ({
  ...demo,
  prompt: componentPrompt({
    source: getExampleSource(demo.id),
    title: demo.title,
  }),
}));

export function DemoBox({
  demo,
  className,
  children,
}: {
  demo: (typeof demos)[number];
  className?: string;
  children?: React.ReactNode;
}) {
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
      {children}
      {demo.render(motion, paused)}
    </div>
  );
}

export function DemoGrid() {
  return (
    <section aria-label="Gust demos" className="grid grid-cols-2 gap-3">
      <HeadlineBox className="col-span-2 h-48 sm:col-span-1 sm:h-56" />
      {examples
        .filter((example) => example.id === "live-price")
        .map((example) => (
          <ExampleCard
            key={example.id}
            example={example}
            className="col-span-2 h-48 sm:col-span-1 sm:h-56"
          />
        ))}
      {demos
        .filter((demo) => demo.id !== "otp")
        .map((demo) => (
          <DemoBox key={demo.id} demo={demo} className="h-36 px-3 sm:h-40" />
        ))}
    </section>
  );
}

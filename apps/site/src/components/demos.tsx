import * as React from "react";

import { DemoCarousel, type CarouselSlide } from "@/components/demo-carousel";
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
import { useStageMoving } from "@/hooks/use-stage-motion";
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
  const moving = useStageMoving();
  const paused = !inView || moving;

  return (
    <div
      ref={ref}
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

const demos = [
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

function DemoBox({ demo, className }: { demo: (typeof demos)[number]; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const moving = useStageMoving();
  const paused = !inView || moving;
  const motion = useDemoMotion(demo.title, demo.id, demo.motion);

  return (
    <div
      ref={ref}
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

const carouselOrder = [
  "guests",
  "color-swatches",
  "flight",
  "headline",
  "status",
  "copy",
  "otp",
  "download",
  "live-price",
];

const carouselSlides: CarouselSlide[] = carouselOrder.flatMap((id) => {
  if (id === "headline") {
    return [
      { id, title: "Headline", width: 360, content: <HeadlineBox className="h-full sm:h-full" /> },
    ];
  }

  const demo = demos.find((entry) => entry.id === id);
  if (demo) {
    return [{ id, title: demo.title, content: <DemoBox demo={demo} className="h-full" /> }];
  }

  const example = examples.find((entry) => entry.id === id);
  return example
    ? [
        {
          id,
          title: example.title,
          width: example.id === "flight" ? 560 : 320,
          content: <ExampleCard example={example} className="h-full sm:col-span-1" />,
        },
      ]
    : [];
});

export function HeroCarousel() {
  return <DemoCarousel initialSlide="headline" slides={carouselSlides} />;
}

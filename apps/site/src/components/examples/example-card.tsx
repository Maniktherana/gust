import type * as React from "react";

import { DemoCopyButton } from "@/components/demo-copy-button";
import { useInView } from "@/hooks/use-element";
import { useDemoMotion, type DemoMotion } from "@/hooks/use-demo-motion";
import { cn } from "@/lib/utils";

type TunedExampleProps = {
  paused?: boolean;
  motion?: DemoMotion;
  numberMotion?: DemoMotion;
  inputMotion?: DemoMotion;
  statusMotion?: DemoMotion;
};

type ExtraProfile = {
  prop: Exclude<keyof TunedExampleProps, "paused" | "motion">;
  title: string;
  motion: DemoMotion;
};

export type Example = {
  component: React.ComponentType<TunedExampleProps>;
  fullBleed?: boolean;
  id: string;
  motion: DemoMotion;
  motionTitle?: string;
  profiles?: ExtraProfile[];
  prompt: string;
  span?: 2;
  title: string;
};

// Examples stop their timers while the card is off screen.
export function ExampleCard({ example, className }: { example: Example; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const paused = !inView;
  const motion = useDemoMotion(
    example.motionTitle ?? example.title,
    example.id,
    example.motion,
    "example",
  );

  return (
    <figure
      ref={ref}
      aria-label={example.title}
      className={cn(
        "relative grid h-72 overflow-hidden rounded-xl bg-surface-raised",
        example.span === 2 && "sm:col-span-2",
        className,
      )}
    >
      <DemoCopyButton prompt={example.prompt} title={example.title} />
      <div className={cn("grid h-full min-w-0 place-items-center", !example.fullBleed && "px-5")}>
        {example.profiles?.length ? (
          <AdditionalMotionExample example={example} profileIndex={0} values={{ motion, paused }} />
        ) : (
          <example.component motion={motion} paused={paused} />
        )}
      </div>
    </figure>
  );
}

function AdditionalMotionExample({
  example,
  profileIndex,
  values,
}: {
  example: Example;
  profileIndex: number;
  values: TunedExampleProps;
}) {
  const profile = example.profiles![profileIndex];
  const motion = useDemoMotion(
    profile.title,
    `${example.id}:${profile.prop}`,
    profile.motion,
    "example",
  );
  const nextValues = { ...values, [profile.prop]: motion };
  return profileIndex + 1 < example.profiles!.length ? (
    <AdditionalMotionExample
      example={example}
      profileIndex={profileIndex + 1}
      values={nextValues}
    />
  ) : (
    <example.component {...nextValues} />
  );
}

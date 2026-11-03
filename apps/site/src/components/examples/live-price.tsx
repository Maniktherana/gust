"use client";

import { TickerDemo } from "@/components/demos/ticker-demo";
import { DEFAULT_MOTION, type GustMotionOptions } from "@maniktherana/gust";

// The dollar prefix stays put, and changing digits follow the direction of the price.
export function LivePriceExample({
  paused = false,
  motion = DEFAULT_MOTION,
}: {
  paused?: boolean;
  motion?: GustMotionOptions;
}) {
  return (
    <div className="relative h-full w-full">
      <TickerDemo motion={motion} paused={paused} />
    </div>
  );
}

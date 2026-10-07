"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const headlines = ["a gust of wind.", "a gust of words.", "a gust of motion."];

// "a gust of " is a shared prefix, so only the last word moves. Next skips
// ahead and restarts the timer.
export function HeadlineDemo({ paused = false }: { paused?: boolean }) {
  const [index, setIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setInterval(() => setIndex((current) => current + 1), 2400);

    return () => window.clearInterval(timer);
  }, [epoch, paused, reducedMotion]);

  return (
    <div className="relative grid size-full place-items-center px-6">
      <Gust
        value={headlines[index % headlines.length] ?? ""}
        className="max-w-full text-3xl font-medium tracking-tight sm:text-4xl"
      />
      <button
        type="button"
        onClick={() => {
          setIndex((current) => current + 1);
          setEpoch((current) => current + 1);
        }}
        className="absolute right-3 bottom-3 h-6 rounded-md bg-foreground/10 px-2 text-xs font-medium transition-[background-color,scale] duration-100 hover:bg-foreground/15 active:scale-[0.98]"
      >
        Next
      </button>
    </div>
  );
}

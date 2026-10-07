"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const phases = [
  { label: "Breathe in", ms: 4000, rising: true, scale: 1 },
  { label: "Hold", ms: 2000, rising: true, scale: 1 },
  { label: "Breathe out", ms: 4000, rising: false, scale: 0.6 },
  { label: "Rest", ms: 2000, rising: false, scale: 0.6 },
];

// Slow timing for a calm pace. Words rise while breathing in and fall while
// breathing out.
export function BreatheExample({ paused = false }: { paused?: boolean }) {
  const [index, setIndex] = useState(phases.length - 1);
  const phase = phases[index] ?? phases[0];

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % phases.length),
      phase.ms,
    );

    return () => window.clearTimeout(timer);
  }, [index, paused, phase.ms]);

  return (
    <div className="relative grid size-44 place-items-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-foreground/5 ring-1 ring-foreground/20 transition-transform ease-in-out ring-inset"
        style={{ transform: `scale(${phase.scale})`, transitionDuration: `${phase.ms}ms` }}
      />
      <Gust
        value={phase.label}
        down={!phase.rising}
        duration={900}
        exitDuration={700}
        stagger={45}
        entranceOvershoot={4}
        entranceScale={1.02}
        className="relative text-xl font-medium"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const stops = [12, 3, 8, 1, 15, 6];
const floorMs = 520;
const doorsMs = 1800;
const smallText = { entranceHeight: 60, exitBlur: 1, exitHeight: 60 };

// Floors rise or fall with the car. "Going " is a shared prefix, so only
// "up" and "down" swap.
export function ElevatorExample({ paused = false }: { paused?: boolean }) {
  const [floor, setFloor] = useState(1);
  const [stop, setStop] = useState(0);
  const target = stops[stop] ?? 1;
  const arrived = floor === target;
  const descending = target < floor;

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setTimeout(
      () => {
        if (arrived) setStop((current) => (current + 1) % stops.length);
        else setFloor((current) => current + Math.sign(target - current));
      },
      arrived ? doorsMs : floorMs,
    );

    return () => window.clearTimeout(timer);
  }, [arrived, floor, paused, target]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 rounded-2xl bg-foreground/5 px-6 py-4">
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`size-4 transition-[transform,opacity] duration-300 ${descending ? "rotate-180" : ""} ${arrived ? "opacity-30" : ""}`}
        >
          <path d="M6 2 L11 10 L1 10 Z" className="fill-foreground" />
        </svg>
        <span className="min-w-[2ch] font-mono text-5xl font-medium tabular-nums">
          <Gust
            value={String(floor)}
            down={descending}
            duration={320}
            exitDuration={280}
            stagger={0}
          />
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        <Gust
          value={arrived ? "Doors opening" : descending ? "Going down" : "Going up"}
          {...smallText}
        />
      </span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const countFrom = 10;
const tickMs = 1000;
const holdMs = 2600;

// Counting down falls, and "T−" is a shared prefix, so it never moves. The
// launch switches to a tall, bouncy rise.
export function LiftoffExample({ paused = false }: { paused?: boolean }) {
  const [count, setCount] = useState(countFrom);
  const launched = count === 0;

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setTimeout(
      () => setCount((current) => (current === 0 ? countFrom : current - 1)),
      launched ? holdMs : tickMs,
    );

    return () => window.clearTimeout(timer);
  }, [count, launched, paused]);

  return (
    <span className="font-mono text-5xl font-medium tracking-tight tabular-nums">
      <Gust
        value={launched ? "Liftoff" : `T−${String(count).padStart(2, "0")}`}
        down={!launched}
        duration={launched ? 900 : 360}
        stagger={launched ? 40 : 0}
        entranceHeight={launched ? 160 : 90}
        entranceOvershoot={launched ? 36 : 8}
        entranceScale={launched ? 1.3 : 1.05}
      />
    </span>
  );
}

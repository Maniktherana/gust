"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";
import { CheckIcon } from "lucide-react";

const steps = [
  { label: "Reading gust.tsx", ms: 1500 },
  { label: "Reading hooks.ts", ms: 1300 },
  { label: "Editing hooks.ts", ms: 1900 },
  { label: "Running tests", ms: 2100 },
  { label: "Done", ms: 2800 },
];
const smallText = { entranceHeight: 60, exitBlur: 1, exitHeight: 60 };
const shown = "scale-100 opacity-100";
const hidden = "scale-50 opacity-0";

// "Reading " is a shared prefix between the first two steps, so only the file
// name changes there. The spinner and check cross-fade in one spot.
export function AgentRunExample({ paused = false }: { paused?: boolean }) {
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const current = steps[step] ?? steps[0];
  const done = step === steps.length - 1;

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setTimeout(() => {
      const next = (step + 1) % steps.length;

      setStep(next);
      if (next === 0) setSeconds(0);
    }, current.ms);

    return () => window.clearTimeout(timer);
  }, [current.ms, paused, step]);

  useEffect(() => {
    if (paused || done) return undefined;

    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);

    return () => window.clearInterval(timer);
  }, [done, paused]);

  return (
    <div className="flex w-full max-w-64 items-center gap-3 rounded-xl bg-foreground/5 px-4 py-3">
      <span className="grid size-4 shrink-0 place-items-center">
        <span
          aria-hidden="true"
          className={`col-start-1 row-start-1 size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground transition-[opacity,scale] duration-300 ${done ? hidden : shown}`}
        />
        <CheckIcon
          aria-hidden="true"
          className={`col-start-1 row-start-1 size-4 text-emerald-600 transition-[opacity,scale] duration-300 dark:text-emerald-400 ${done ? shown : hidden}`}
        />
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <Gust value={done ? `Done in ${seconds}s` : current.label} {...smallText} />
      </span>
      {done ? null : (
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
          <Gust value={`${seconds}s`} stagger={0} {...smallText} />
        </span>
      )}
    </div>
  );
}

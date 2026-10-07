"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";

export const statusMotion = {
  entranceOvershoot: 10,
  entranceScale: 1.15,
  exitDuration: 440,
  exitHeight: 120,
} satisfies Omit<GustProps, "value">;

const steps = [
  { color: "text-muted-foreground", key: "queued", label: "Queued" },
  { color: "text-amber-600 dark:text-amber-300", key: "building", label: "Building" },
  { color: "text-sky-600 dark:text-sky-400", key: "deploying", label: "Deploying" },
  { color: "text-emerald-600 dark:text-emerald-400", key: "live", label: "Live" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const glyphTransition =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

function StatusGlyph({ children, shown }: { children: ReactNode; shown: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`col-start-1 row-start-1 grid place-items-center ${glyphTransition} ${shown ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-[4px]"}`}
    >
      {children}
    </span>
  );
}

function StatusIcon({ active, animating }: { active: StepKey; animating: boolean }) {
  return (
    <>
      <StatusGlyph shown={active === "queued"}>
        <span
          className={`size-4 rounded-full border-2 border-current ${animating ? "motion-safe:animate-pulse" : ""}`}
        />
      </StatusGlyph>
      <StatusGlyph shown={active === "building"}>
        <svg
          viewBox="0 0 20 20"
          className={`size-[18px] ${animating ? "motion-safe:animate-[spin_1s_linear_infinite_reverse]" : ""}`}
        >
          <path
            d="m5,5.101c1.271-1.297,3.041-2.101,5-2.101,3.866,0,7,3.134,7,7s-3.134,7-7,7c-2.792,0-5.203-1.635-6.326-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <polygon
            points="4.367 3.044 3.771 6.798 7.516 6.145 4.367 3.044"
            fill="currentColor"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </StatusGlyph>
      <StatusGlyph shown={active === "deploying"}>
        <span className="relative grid place-items-center">
          <span
            className={`absolute size-5 rounded-full border-[1.5px] border-current ${animating ? "motion-safe:animate-ping" : ""}`}
          />
          <span className="relative size-2.5 rounded-full bg-current" />
        </span>
      </StatusGlyph>
      <StatusGlyph shown={active === "live"}>
        <svg viewBox="0 0 20 20" className="size-5">
          <path
            d="m17.999,10c0-1.097-.567-2.113-1.465-2.707.215-1.054-.103-2.174-.878-2.95-.775-.776-1.896-1.094-2.95-.878-.593-.897-1.609-1.464-2.706-1.464s-2.113.567-2.706,1.464c-1.053-.216-2.174.102-2.95.878s-1.093,1.896-.878,2.949c-.897.593-1.465,1.61-1.465,2.707s.567,2.113,1.465,2.707c-.215,1.054.103,2.174.878,2.95s1.898,1.092,2.95.878c.593.897,1.609,1.464,2.706,1.464s2.113-.568,2.706-1.465c1.059.214,2.176-.103,2.95-.878.776-.776,1.094-1.896.878-2.95.897-.593,1.465-1.609,1.465-2.707Zm-4.218-1.875l-4,5c-.178.222-.442.358-.726.374-.019,0-.037.001-.056.001-.265,0-.52-.105-.707-.293l-2-2c-.391-.391-.391-1.023,0-1.414s1.023-.391,1.414,0l1.21,1.21,3.302-4.127c.347-.43.975-.502,1.406-.156.431.345.501.974.156,1.405Z"
            fill="currentColor"
          />
        </svg>
      </StatusGlyph>
    </>
  );
}

// The label and its color change together while the icon cross-fades.
export function StatusDemo({
  motion = statusMotion,
  paused = false,
}: {
  motion?: Omit<GustProps, "value">;
  paused?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const step = steps[index] ?? steps[0];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % steps.length),
      2100,
    );

    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <span className="flex items-center gap-2.5 rounded-full bg-foreground/5 px-4 py-1.5">
      <span
        className={`grid size-5 place-items-center transition-colors duration-500 ${step.color}`}
      >
        <StatusIcon active={step.key} animating={!paused && !reducedMotion} />
      </span>
      <Gust value={step.label} {...motion} className={`text-xl font-semibold ${step.color}`} />
    </span>
  );
}

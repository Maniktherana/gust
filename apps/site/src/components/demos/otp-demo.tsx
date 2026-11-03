"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_MOTION,
  Gust,
  resolveMotionOptions,
  resolveTransitionConfig,
  type GustMotionOptions,
} from "@maniktherana/gust";

// Each step also says how it leaves: "wipe" clears the whole code in one
// staggered exit, "backspace" deletes digit by digit down to the prefix it
// shares with the next code (4589 → 45 → 4567).
const steps = [
  { code: "1234", exit: "backspace" },
  { code: "4589", exit: "backspace" },
  { code: "4567", exit: "wipe" },
] as const;

const timing = { backspace: 100, firstDigit: 280, hold: 1250, type: 100, wipe: 1000 };

type Phase = "backspacing" | "holding" | "typing" | "wiping";
export type OtpState = { code: string; phase: Phase; step: number };

function sharedPrefixLength(a: string, b: string) {
  let index = 0;

  while (index < Math.min(a.length, b.length) && a[index] === b[index]) index += 1;

  return index;
}

export function otpDelay({ code, phase }: OtpState, motion: GustMotionOptions = DEFAULT_MOTION) {
  if (phase === "holding") return timing.hold;
  if (phase === "backspacing") return timing.backspace;
  if (phase === "wiping") {
    const digits = steps.find((step) => step.exit === "wipe")?.code.length ?? 0;
    const resolved = resolveTransitionConfig(resolveMotionOptions(motion), 0, digits);
    return (
      resolved.exitDelay +
      resolved.exitDuration +
      Math.max(0, digits - 1) * resolved.exitStagger +
      timing.wipe
    );
  }

  return code.length === 0 ? timing.firstDigit : timing.type;
}

export function advanceOtp(current: OtpState): OtpState {
  const step = steps[current.step % steps.length] ?? steps[0];
  const nextStep = (current.step + 1) % steps.length;
  const nextCode = steps[nextStep]?.code ?? "";

  if (current.phase === "holding") {
    return step.exit === "wipe"
      ? { code: "", phase: "wiping", step: nextStep }
      : { ...current, phase: "backspacing" };
  }

  if (current.phase === "wiping") {
    return { code: step.code.slice(0, 1), phase: "typing", step: current.step };
  }

  if (current.phase === "backspacing") {
    const code = current.code.slice(0, -1);

    return code.length === sharedPrefixLength(step.code, nextCode)
      ? { code, phase: "typing", step: nextStep }
      : { ...current, code };
  }

  const code = step.code.slice(0, current.code.length + 1);

  return { ...current, code, phase: code === step.code ? "holding" : "typing" };
}

// Typed digits rise in one by one; deleted ones lift away.
export function OtpDemo({
  motion = DEFAULT_MOTION,
  paused = false,
}: {
  motion?: GustMotionOptions;
  paused?: boolean;
}) {
  const [state, setState] = useState<OtpState>({ code: "", phase: "typing", step: 0 });
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
    const timer = window.setTimeout(() => setState(advanceOtp), otpDelay(state, motion));

    return () => window.clearTimeout(timer);
  }, [
    motion.exitDelay,
    motion.exitDuration,
    motion.exitStagger,
    motion.stagger,
    motion.staggerMode,
    motion.staggerSpread,
    paused,
    reducedMotion,
    state,
  ]);

  return (
    // A tall phone bleeding past the box bottom; the digits land at the box's
    // vertical center with the caption visible beneath them.
    <div className="absolute top-6 left-1/2 h-72 w-52 -translate-x-1/2 rounded-t-[2.5rem] border border-b-0 border-border">
      <div className="flex flex-col items-center pt-14">
        {/* items-start keeps Gust's top edge fixed while its height collapses
            on an empty code, so leaving digits don't dip mid-wipe. */}
        <div className="flex h-10 items-start font-sans text-3xl font-semibold tracking-widest tabular-nums">
          {/* -mr cancels the letter-spacing after the last digit, so a full
              code sits optically centered. */}
          <Gust motion={motion} className="-mr-[0.1em]">
            {reducedMotion ? steps[0].code : state.code}
          </Gust>
        </div>
        <span className="mt-2 font-sans text-[10px] text-muted-foreground">enter code</span>
      </div>
    </div>
  );
}

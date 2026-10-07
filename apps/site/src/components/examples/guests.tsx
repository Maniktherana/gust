"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";
import { MinusIcon, PlusIcon } from "lucide-react";

const min = 0;
const max = 1000;
const demoCounts = [
  7, 8, 9, 10, 11, 12, 47, 87, 97, 98, 99, 100, 101, 102, 347, 687, 987, 997, 998, 999, 1000,
];
export const guestsMotion: Omit<GustProps, "value"> = {
  duration: 320,
  exitDuration: 220,
  stagger: 0,
  entranceOvershoot: 0,
  entranceHeight: 100,
  exitHeight: 100,
  exitBlur: 4,
  blur: true,
  scale: false,
};
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const buttonClassName =
  "grid size-11 shrink-0 place-items-center rounded-full bg-foreground/5 text-muted-foreground ring-1 ring-foreground/10 transition-[color,scale,opacity] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-foreground/50 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100";

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

type GuestState = { count: number; falling: boolean; touched: boolean };

function step(current: GuestState, delta: number, touched: boolean): GuestState {
  const count = Math.min(max, Math.max(min, current.count + delta));

  return { count, falling: count < current.count, touched: current.touched || touched };
}

// Count through several magnitudes, slowing at digit boundaries so the change
// from 9 to 10, 99 to 100 and 999 to 1000 remains easy to see.
export function GuestsExample({
  paused = false,
  motion = guestsMotion,
}: {
  paused?: boolean;
  motion?: Omit<GustProps, "value">;
}) {
  const [state, setState] = useState<GuestState>({ count: 7, falling: false, touched: false });
  const reducedMotion = usePrefersReducedMotion();
  const countId = useId();
  const resolvedMotion = { ...guestsMotion, ...motion };
  const transitionWindow =
    Math.max(
      resolvedMotion.duration ?? guestsMotion.duration ?? 320,
      resolvedMotion.exitDuration ?? guestsMotion.exitDuration ?? 220,
    ) +
    Math.max(0, resolvedMotion.stagger ?? 0) * 3;
  const change = (delta: number) => setState((current) => step(current, delta, true));

  // Plays on its own until someone takes over.
  useEffect(() => {
    if (paused || reducedMotion || state.touched) return undefined;

    const timer = window.setTimeout(
      () =>
        setState((current) => {
          const index = demoCounts.indexOf(current.count);
          const count = demoCounts[(index + 1) % demoCounts.length];
          return step(current, count - current.count, false);
        }),
      Math.max(state.count === max ? 1300 : 400, transitionWindow + 80),
    );

    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion, state.count, state.touched, transitionWindow]);

  return (
    <div role="group" aria-label="Counter" className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Decrease count"
        aria-describedby={countId}
        disabled={state.count <= min}
        onClick={() => change(-1)}
        className={buttonClassName}
      >
        <MinusIcon className="size-4" aria-hidden="true" />
      </button>
      <span
        id={countId}
        role="status"
        aria-live={state.touched ? "polite" : "off"}
        aria-atomic="true"
        className="flex w-32 items-center justify-center"
      >
        <span className="sr-only">{state.count}</span>
        <span aria-hidden="true" className="inline-flex text-4xl font-medium tabular-nums">
          <Gust
            value={String(state.count)}
            {...resolvedMotion}
            down={motion.down ?? state.falling}
            {...(reducedMotion
              ? {
                  duration: 120,
                  exitDuration: 80,
                  stagger: 0,
                  entranceOvershoot: 0,
                  entranceHeight: 0,
                  exitHeight: 0,
                  blur: false,
                  scale: false,
                }
              : {})}
          />
        </span>
      </span>
      <button
        type="button"
        aria-label="Increase count"
        aria-describedby={countId}
        disabled={state.count >= max}
        onClick={() => change(1)}
        className={buttonClassName}
      >
        <PlusIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

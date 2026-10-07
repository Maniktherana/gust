import * as React from "react";
import { useReducedMotion } from "motion/react";

import { useCycle } from "@/hooks/use-cycle";
import { useInView } from "@/hooks/use-element";
import { holdFor, type MotionSettings } from "@/lib/gust-motion";

// A cycling preview for one reference row. It pauses offscreen, and moves on
// to the next value shortly after a control changes, so every change shows up
// as a real transition.
export function useMotionPreview(
  words: readonly string[],
  settings: MotionSettings,
  { paused = false }: { paused?: boolean } = {},
) {
  const [panelRef, inView] = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const cycle = useCycle(words, {
    hold: (previous, current) => holdFor(previous, current, settings),
    paused: paused || !inView || Boolean(reducedMotion),
  });
  const { next } = cycle;
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }

    if (paused || !inView || reducedMotion) return undefined;

    const timer = window.setTimeout(next, 280);

    return () => window.clearTimeout(timer);
  }, [inView, next, paused, reducedMotion, settings]);

  // Before the first change there is no previous value, so describe the
  // upcoming transition instead.
  const fresh = cycle.previous === cycle.current;

  return {
    cycle,
    from: fresh ? cycle.current : cycle.previous,
    panelRef,
    to: fresh ? cycle.upcoming : cycle.current,
  };
}

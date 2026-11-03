"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const ICON = {
  states: ["a", "b"] as const,
  hidden: { opacity: 0, filter: "blur(2px)", scale: 0.25 },
  visible: { opacity: 1, filter: "blur(0px)", scale: 1 },
  transition: {
    type: "tween" as const,
    duration: 0.25,
    ease: [0.42, 0, 0.58, 1] as const,
  },
  reducedTransition: { duration: 0 },
};

type IconSwapProps = Omit<ComponentProps<"span">, "children"> & {
  state: "a" | "b";
  a: ReactNode;
  b: ReactNode;
};

function IconSwap({ state, a, b, className, ...props }: IconSwapProps) {
  const reducedMotion = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="icon-swap"
      data-state={state}
      className={cn("relative inline-grid", className)}
    >
      {ICON.states.map((icon) => (
        <motion.span
          key={icon}
          data-icon={icon}
          className="col-start-1 row-start-1 grid place-items-center"
          initial={false}
          animate={icon === state ? ICON.visible : ICON.hidden}
          transition={reducedMotion ? ICON.reducedTransition : ICON.transition}
        >
          {icon === "a" ? a : b}
        </motion.span>
      ))}
    </span>
  );
}

export { IconSwap, type IconSwapProps };

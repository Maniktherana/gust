import * as React from "react";

import { Gust } from "@maniktherana/gust";

// Each step also says how it leaves: "wipe" clears the whole code in one
// staggered exit, "backspace" deletes digit by digit down to the shared prefix
// with the next code (7402 → 74 → 7482).
const otpSteps = [
  { code: "4821", exit: "wipe" },
  { code: "0937", exit: "backspace" },
  { code: "7402", exit: "backspace" },
  { code: "7482", exit: "wipe" },
] as const;

function sharedPrefixLength(a: string, b: string) {
  let index = 0;

  while (index < Math.min(a.length, b.length) && a[index] === b[index]) index += 1;

  return index;
}

export function OtpDemo() {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [code, setCode] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  // Each round gets its own typing cadence: some entries fast, some hesitant.
  const cadence = React.useRef(140);
  const step = otpSteps[stepIndex % otpSteps.length];
  const target = step.code;
  const nextTarget = otpSteps[(stepIndex + 1) % otpSteps.length].code;

  React.useEffect(() => {
    if (!deleting && code.length === 0) cadence.current = 80 + Math.random() * 160;

    const shared = sharedPrefixLength(target, nextTarget);
    const delay = deleting
      ? 100 + Math.random() * 70
      : code.length === target.length
        ? 1200 + Math.random() * 700
        : code.length === 0
          ? 500
          : cadence.current + Math.random() * 90;
    const timer = window.setTimeout(() => {
      if (deleting) {
        if (code.length > shared) {
          setCode((current) => current.slice(0, -1));
        } else {
          cadence.current = 80 + Math.random() * 160;
          setDeleting(false);
          setStepIndex((current) => (current + 1) % otpSteps.length);
        }
      } else if (code.length === target.length) {
        if (step.exit === "wipe") {
          setCode("");
          setStepIndex((current) => (current + 1) % otpSteps.length);
        } else {
          setDeleting(true);
        }
      } else {
        setCode(target.slice(0, code.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [code, deleting, target, nextTarget, step.exit]);

  return (
    // A tall phone bleeding past the box bottom; the digits land at the box's
    // vertical center with the microcopy visible beneath them.
    <div className="absolute top-6 left-1/2 h-72 w-52 -translate-x-1/2 rounded-t-[2.5rem] border border-b-0 border-border-strong">
      <div className="flex flex-col items-center pt-14">
        {/* The caret is absolutely positioned off the digits' right edge so it
            never participates in centering. The code alone defines the box.
            items-start keeps the Gust root's top edge fixed while its height
            collapses on an empty code, so exiting digits don't dip mid-wipe. */}
        <div className="relative flex h-10 items-start">
          <Gust
            text={code}
            // -mr compensates the trailing letter-spacing after the last digit
            // so a full code sits optically centered in the phone.
            className="-mr-[0.1em] font-mono text-3xl font-semibold tracking-widest tabular-nums"
          />
          <span
            aria-hidden="true"
            className="absolute top-1 left-full ml-1.5 h-7 w-px animate-pulse bg-foreground"
          />
        </div>
        <span className="mt-2 font-mono text-[10px] text-muted-foreground">enter code</span>
      </div>
    </div>
  );
}

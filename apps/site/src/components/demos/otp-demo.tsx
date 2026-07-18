import * as React from "react";
import { useDialKit } from "dialkit";

import { Gust } from "@maniktherana/gust";

// Each step also says how it leaves: "wipe" clears the whole code in one
// staggered exit, "backspace" deletes digit by digit down to the shared prefix
// with the next code (7402 → 74 → 7482).
const otpSteps = [
  { code: "1234", exit: "backspace" },
  { code: "4589", exit: "backspace" },
  { code: "4567", exit: "wipe" },
] as const;

type OtpPhase = "backspacing" | "holding" | "typing" | "wiping";

type OtpState = {
  code: string;
  phase: OtpPhase;
  stepIndex: number;
};

const otpTiming = {
  backspace: 150,
  firstDigit: 280,
  hold: 1250,
  type: 100,
  wipe: 100,
} as const;

function sharedPrefixLength(a: string, b: string) {
  let index = 0;

  while (index < Math.min(a.length, b.length) && a[index] === b[index]) index += 1;

  return index;
}

export function OtpDemo() {
  const controls = useDialKit(
    "OTP demo",
    {
      timing: {
        duration: [440, 0, 1200, 10],
        exitDuration: [440, 0, 1200, 10],
        stagger: [12, 0, 80, 1],
      },
      entrance: {
        height: [8, 0, 120, 1],
        offset: [90, 0, 200, 1],
        scale: [1.1, 1, 2, 0.01],
      },
      exit: {
        blurCap: [4, 0, 12, 0.25],
        height: [90, 0, 200, 1],
        scale: [0.4, 0, 1.5, 0.01],
      },
      effects: {
        blur: true,
        scale: true,
        preservePrefix: true,
      },
    },
    { id: "gust-demo:otp" },
  );
  const [{ code, phase, stepIndex }, setOtp] = React.useState<OtpState>({
    code: "",
    phase: "typing",
    stepIndex: 0,
  });

  React.useEffect(() => {
    const delay =
      phase === "holding"
        ? otpTiming.hold
        : phase === "backspacing"
          ? otpTiming.backspace
          : phase === "wiping"
            ? otpTiming.wipe
            : code.length === 0
              ? otpTiming.firstDigit
              : otpTiming.type;

    const timer = window.setTimeout(() => {
      setOtp((current) => {
        const currentStep = otpSteps[current.stepIndex % otpSteps.length];
        const currentTarget = currentStep.code;
        const followingStepIndex = (current.stepIndex + 1) % otpSteps.length;
        const followingTarget = otpSteps[followingStepIndex].code;

        if (current.phase === "holding") {
          return currentStep.exit === "wipe"
            ? { code: "", phase: "wiping", stepIndex: followingStepIndex }
            : { ...current, phase: "backspacing" };
        }

        if (current.phase === "wiping") {
          return {
            code: currentTarget.slice(0, 1),
            phase: currentTarget.length === 1 ? "holding" : "typing",
            stepIndex: current.stepIndex,
          };
        }

        if (current.phase === "backspacing") {
          const shared = sharedPrefixLength(currentTarget, followingTarget);
          const nextCode = current.code.slice(0, -1);

          return nextCode.length === shared
            ? { code: nextCode, phase: "typing", stepIndex: followingStepIndex }
            : { ...current, code: nextCode };
        }

        const nextCode = currentTarget.slice(0, current.code.length + 1);

        return {
          ...current,
          code: nextCode,
          phase: nextCode === currentTarget ? "holding" : "typing",
        };
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [code, phase, stepIndex]);

  return (
    // A tall phone bleeding past the box bottom; the digits land at the box's
    // vertical center with the microcopy visible beneath them.
    <div className="absolute top-6 left-1/2 h-72 w-52 -translate-x-1/2 rounded-t-[2.5rem] border border-b-0 border-border">
      <div className="flex flex-col items-center pt-14">
        {/* items-start keeps the Gust root's top edge fixed while its height
            collapses on an empty code, so exiting digits don't dip mid-wipe. */}
        <div className="flex h-10 items-start font-mono text-3xl font-semibold tracking-widest tabular-nums">
          <Gust
            data-testid="otp-code"
            value={code}
            duration={controls.timing.duration}
            exitDuration={controls.timing.exitDuration}
            stagger={controls.timing.stagger}
            entranceHeight={controls.entrance.height}
            entranceOffset={controls.entrance.offset}
            entranceScale={controls.entrance.scale}
            exitBlurCap={controls.exit.blurCap}
            exitHeight={controls.exit.height}
            exitScale={controls.exit.scale}
            blur={controls.effects.blur}
            scale={controls.effects.scale}
            preservePrefix={controls.effects.preservePrefix}
            // -mr compensates the trailing letter-spacing after the last digit
            // so a full code sits optically centered in the phone.
            className="-mr-[0.1em]"
          />
        </div>
        <span className="mt-2 font-mono text-[10px] text-muted-foreground">enter code</span>
      </div>
    </div>
  );
}

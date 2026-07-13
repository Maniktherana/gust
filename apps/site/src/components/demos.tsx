import * as React from "react";

import {
  IconArrowRotateAnticlockwise,
  IconBadgeCheck,
  IconCloneFilled,
  IconTriangleFilled,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Gust } from "@gust/core";
import { cn } from "@/lib/utils";

const glyphVisible = "scale-100 opacity-100 blur-none";
const glyphHidden = "scale-25 opacity-0 blur-[4px]";
const glyphTransition =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

function DemoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-48 place-items-center overflow-hidden rounded-xl bg-surface-raised px-6">
      {children}
    </div>
  );
}

function CopyDemo() {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);

  const copy = () => {
    setCopied(true);

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, 1800);
  };

  React.useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <Button variant="outline" onClick={copy}>
      <span className="grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1">
        <IconCloneFilled className={cn(glyphTransition, copied ? glyphHidden : glyphVisible)} />
        <IconBadgeCheck className={cn(glyphTransition, copied ? glyphVisible : glyphHidden)} />
      </span>
      <Gust text={copied ? "Copied" : "Copy"} align="start" />
    </Button>
  );
}

const deploySteps = [
  { colorClassName: "text-muted-foreground", key: "queued", label: "Queued" },
  { colorClassName: "text-warn", key: "building", label: "Building" },
  { colorClassName: "text-info", key: "deploying", label: "Deploying" },
  { colorClassName: "text-ok", key: "live", label: "Live" },
] as const;

function StatusGlyph({ children, shown }: { children: React.ReactNode; shown: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "col-start-1 row-start-1 grid place-items-center",
        glyphTransition,
        shown ? glyphVisible : glyphHidden,
      )}
    >
      {children}
    </span>
  );
}

function StatusDemo() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % deploySteps.length);
    }, 2100);

    return () => window.clearInterval(timer);
  }, []);

  const active = deploySteps[step];

  return (
    <span className="flex h-8 items-center gap-2 rounded-full border border-border bg-field pr-3.5 pl-3 shadow-[var(--shadow-highlight)]">
      <span
        className={cn(
          "grid size-4 place-items-center transition-colors duration-500",
          active.colorClassName,
        )}
      >
        <StatusGlyph shown={active.key === "queued"}>
          <span className="size-3 animate-pulse rounded-full border-[1.5px] border-current" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "building"}>
          <IconArrowRotateAnticlockwise className="size-3.5 animate-spin [animation-direction:reverse]" />
        </StatusGlyph>
        <StatusGlyph shown={active.key === "deploying"}>
          <span className="relative grid place-items-center">
            <span className="absolute size-3 animate-ping rounded-full bg-current opacity-75" />
            <span className="relative size-2 rounded-full bg-current" />
          </span>
        </StatusGlyph>
        <StatusGlyph shown={active.key === "live"}>
          <IconBadgeCheck className="size-4" />
        </StatusGlyph>
      </span>
      <Gust
        text={active.label}
        align="start"
        className={cn("text-sm font-medium", active.colorClassName)}
      />
    </span>
  );
}

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

function OtpDemo() {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [code, setCode] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  // Each round gets its own typing cadence — some entries fast, some hesitant.
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
            never participates in centering — the code alone defines the box.
            items-start keeps the Gust root's top edge fixed while its height
            collapses on an empty code, so exiting digits don't dip mid-wipe. */}
        <div className="relative flex h-10 items-start">
          <Gust
            text={code}
            align="start"
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

// Mostly cent-level moves with a couple of spikes, cycling on ticker-speed
// random delays. Direction comes from comparing consecutive entries.
const tickerPrices = [199.85, 199.86, 199.91, 200.54, 201, 190.42, 189.76, 189.37, 196, 193.98];

function TickerDemo() {
  const [priceIndex, setPriceIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setPriceIndex((current) => (current + 1) % tickerPrices.length);
      },
      400 + Math.random() * 600,
    );

    return () => window.clearTimeout(timer);
  }, [priceIndex]);

  const price = tickerPrices[priceIndex];
  const previous = tickerPrices[(priceIndex + tickerPrices.length - 1) % tickerPrices.length];
  const up = price >= previous;
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors duration-300",
        up ? "bg-(--ok)/12 text-(--ok)" : "bg-(--bad)/12 text-(--bad)",
      )}
    >
      <IconTriangleFilled
        className={cn("size-4 transition-transform duration-300", !up && "rotate-180")}
      />
      <Gust
        text={`$${price.toFixed(2)}`}
        align="start"
        duration={320}
        exitDuration={260}
        stagger={10}
        className="text-xl font-semibold tabular-nums"
      />
    </span>
  );
}

const demoBoxes = [
  { demo: CopyDemo, key: "copy" },
  { demo: StatusDemo, key: "status" },
  { demo: OtpDemo, key: "otp" },
  { demo: TickerDemo, key: "ticker" },
];

export function DemoGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {demoBoxes.map((box) => (
        <DemoBox key={box.key}>
          <box.demo />
        </DemoBox>
      ))}
    </div>
  );
}

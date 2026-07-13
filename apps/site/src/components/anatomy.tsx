// The blueprint of one transition. Both lines share a label column on the left
// ("exit" / "enter") so the two "a gust of" prefixes align exactly. Each flying
// letter is a positioned wrapper (transform) around a styled glyph
// (scale/opacity/blur); its phase word hangs off the wrapper on a hairline
// connector, staggered so neighbouring labels never crowd each other.

import { cn } from "@/lib/utils";

type FlyingCharacter = {
  character: string;
  /** Tailwind offset for the label, e.g. "-bottom-13" — staggered per letter. */
  connectorClassName?: string;
  glyphClassName: string;
  label?: string;
  labelClassName?: string;
  wrapperClassName: string;
};

const exitCharacters: FlyingCharacter[] = [
  {
    character: "w",
    connectorClassName: "top-full h-2",
    glyphClassName: "scale-95 opacity-60 blur-[2px]",
    label: "lift",
    labelClassName: "-bottom-7",
    wrapperClassName: "-translate-y-3",
  },
  {
    character: "i",
    glyphClassName: "scale-90 opacity-45 blur-[2px]",
    wrapperClassName: "-translate-y-4",
  },
  {
    character: "n",
    connectorClassName: "top-full h-3",
    glyphClassName: "scale-[0.85] opacity-30 blur-[2px]",
    label: "shrink",
    labelClassName: "-bottom-8",
    wrapperClassName: "-translate-y-5",
  },
  {
    character: "d",
    connectorClassName: "top-full h-9",
    glyphClassName: "scale-75 opacity-20 blur-[2px]",
    label: "blur",
    labelClassName: "-bottom-14",
    wrapperClassName: "-translate-y-6",
  },
];

// Right to left is time: launched low, rising, swelling to the 1.1 peak just
// above the baseline, then seated.
const enterCharacters: FlyingCharacter[] = [
  {
    character: "w",
    connectorClassName: "top-full h-2",
    glyphClassName: "scale-100 opacity-100",
    label: "settle",
    labelClassName: "-bottom-7",
    wrapperClassName: "translate-y-0",
  },
  {
    character: "o",
    connectorClassName: "bottom-full h-2",
    glyphClassName: "scale-110 opacity-90",
    label: "overshoot",
    labelClassName: "-top-7",
    wrapperClassName: "-translate-y-1",
  },
  {
    character: "r",
    glyphClassName: "scale-105 opacity-65",
    wrapperClassName: "translate-y-1",
  },
  {
    character: "d",
    glyphClassName: "scale-100 opacity-40",
    wrapperClassName: "translate-y-3",
  },
  {
    character: "s",
    connectorClassName: "top-full h-2",
    glyphClassName: "scale-100 opacity-25 blur-[1px]",
    label: "rise",
    labelClassName: "-bottom-7",
    wrapperClassName: "translate-y-5",
  },
];

function FlyingChar({
  character,
  connectorClassName,
  glyphClassName,
  label,
  labelClassName,
  wrapperClassName,
}: FlyingCharacter) {
  return (
    <span className={cn("relative inline-block", wrapperClassName)}>
      <span className={cn("inline-block", glyphClassName)}>{character}</span>
      {label ? (
        <>
          <span
            aria-hidden="true"
            className={cn("absolute left-1/2 w-px bg-border-strong", connectorClassName)}
          />
          <span
            className={cn(
              "absolute left-1/2 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-muted-foreground",
              labelClassName,
            )}
          >
            {label}
          </span>
        </>
      ) : null}
    </span>
  );
}

export function AnatomyFigure() {
  return (
    <figure
      aria-label="One transition: the shared prefix stays put; the old suffix lifts away shrinking and blurring; the new suffix rises in, overshooting slightly above the baseline at peak scale before settling, each character starting 12 milliseconds after the last."
      className="relative overflow-x-auto rounded-xl bg-surface-raised px-6 py-14 select-none"
    >
      {/* Grid geometry: rows are leading-none text-4xl (36px boxes) with a
          60px gap, so consecutive baselines sit exactly 96px (3 cells) apart;
          the offset pins a horizontal line to both baselines. */}
      <div
        aria-hidden="true"
        className="box-grid pointer-events-none absolute inset-0 [--grid-offset-y:23px] [mask-image:radial-gradient(75%_85%_at_50%_50%,black_45%,transparent_100%)]"
      />
      <div className="relative mx-auto grid w-fit grid-cols-[auto_auto] items-baseline gap-x-8 gap-y-15">
        <figcaption className="font-mono text-xs text-muted-foreground">exit</figcaption>
        <div className="flex items-baseline text-4xl leading-none font-medium tracking-tight">
          <span className="whitespace-pre">a gust of </span>
          {exitCharacters.map((entry) => (
            <FlyingChar key={`exit-${entry.character}`} {...entry} />
          ))}
        </div>

        <figcaption className="font-mono text-xs text-muted-foreground">enter</figcaption>
        <div className="flex items-baseline text-4xl leading-none font-medium tracking-tight">
          <span className="whitespace-pre">a gust of </span>
          {enterCharacters.map((entry) => (
            <FlyingChar key={`enter-${entry.character}`} {...entry} />
          ))}
        </div>
      </div>
    </figure>
  );
}

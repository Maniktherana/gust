import * as React from "react";
import { useDialKit } from "dialkit";

import { IconTriangleFilled } from "@/components/icons";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Gust } from "@maniktherana/gust";
import { Liveline } from "liveline";
import type { LivelinePoint } from "liveline";

const tickerPrices = [
  // Original phrase. Keep this order intact for the digit/direction demo.
  199.85, 199.86, 199.91, 200.54, 201, 190.42, 189.76, 189.37, 196, 193.98,
  // A quiet climb with mixed cent-level reversals.
  194.01, 194.06, 194.18, 194.14, 194.39, 194.72, 194.68, 195.04, 195.83, 195.77, 196.22, 196.86,
  196.49, 196.51, 196.93, 197.64, 197.58, 198.12, 198.07, 198.83,
  // Breakout, hesitation, then a rounded turn.
  199.41, 199.28, 199.66, 200.12, 201.04, 200.87, 201.33, 202.19, 203.48, 202.96, 203.11, 204.26,
  203.78, 202.64, 202.71, 202.08, 201.54, 201.72, 200.93, 200.18,
  // Uneven selloff into a recovery rather than another identical spike.
  199.84, 198.61, 197.42, 197.09, 196.33, 195.17, 194.81, 194.93, 194.22, 193.76, 193.89, 194.31,
  194.27, 194.82, 195.56, 196.77, 196.54, 197.38, 198.92, 198.47,
  // Choppy middle with short direction changes to exercise more digit swaps.
  198.72, 199.06, 198.94, 199.73, 200.41, 199.88, 200.02, 201.26, 201.19, 200.64, 200.81, 199.57,
  199.21, 198.73, 198.79, 199.34, 200.58, 202.03, 201.67, 202.44,
  // One late swing, then a softer descent into the loop restart.
  203.28, 203.01, 203.84, 204.51, 203.93, 202.76, 202.38, 201.09, 200.42, 199.08, 198.36, 198.49,
  197.22, 196.84, 197.06, 197.91, 197.87, 198.32, 199.18, 200.73, 201.48, 201.12, 200.69, 199.93,
  199.97, 200.31, 199.64, 198.88, 198.14, 197.69, 197.74, 196.83, 196.26, 195.48, 195.63, 195.21,
  194.57, 194.91, 194.33, 193.72,
];

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionPreference() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    () => false,
  );
}

export function TickerDemo() {
  const controls = useDialKit(
    "Ticker demo",
    {
      timing: {
        duration: [320, 0, 1200, 10],
        exitDuration: [260, 0, 1200, 10],
        stagger: [10, 0, 80, 1],
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
    { id: "gust-demo:ticker" },
  );
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [data, setData] = React.useState<LivelinePoint[]>([]);
  const [priceIndex, setPriceIndex] = React.useState(0);

  React.useEffect(() => {
    const now = Date.now() / 1000;
    const history = [...tickerPrices.slice(1), tickerPrices[0]];

    setData(
      history.map((value, index) => ({
        time: now - (history.length - 1 - index) * 0.65,
        value,
      })),
    );
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setTimeout(
      () => {
        const nextIndex = (priceIndex + 1) % tickerPrices.length;

        setPriceIndex(nextIndex);
        setData((current) =>
          [...current, { time: Date.now() / 1000, value: tickerPrices[nextIndex] }].slice(-240),
        );
      },
      400 + Math.random() * 600,
    );

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, priceIndex]);

  const price = tickerPrices[priceIndex];
  const previous = tickerPrices[(priceIndex + tickerPrices.length - 1) % tickerPrices.length];
  const up = price >= previous;

  return (
    <div className="absolute inset-0">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 opacity-35"
        aria-hidden="true"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, black 0, black calc(100% - 40px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, black 0, black calc(100% - 40px), transparent 100%)",
        }}
      >
        <Liveline
          data={data}
          value={price}
          theme={resolvedTheme}
          color={up ? "#2c9d62" : "#d84a4a"}
          window={74}
          grid={false}
          badge={false}
          momentum={false}
          fill
          guides={false}
          scrub={false}
          pulse={false}
          paused={prefersReducedMotion}
          lineWidth={1.5}
          lerpSpeed={0.12}
          padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          cursor="default"
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <span
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors duration-300 motion-reduce:transition-none",
            up ? "text-(--ok)" : "text-(--bad)",
          )}
          style={{
            backgroundColor: up
              ? "color-mix(in oklab, var(--ok) 12%, var(--surface-raised))"
              : "color-mix(in oklab, var(--bad) 12%, var(--surface-raised))",
          }}
          aria-label={`Simulated stock price, $${price.toFixed(2)}`}
        >
          <IconTriangleFilled
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform duration-300 motion-reduce:transition-none",
              !up && "rotate-180",
            )}
          />
          <Gust
            value={`$${price.toFixed(2)}`}
            down={!up}
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
            className="text-xl font-semibold tabular-nums"
          />
        </span>
      </div>
    </div>
  );
}

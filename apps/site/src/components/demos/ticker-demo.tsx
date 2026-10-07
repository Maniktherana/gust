"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";
import { Liveline, type LivelinePoint } from "liveline";

export const tickerMotion = {
  duration: 320,
  entranceOvershoot: 8,
  entranceHeight: 100,
  exitDuration: 320,
} satisfies Omit<GustProps, "value">;

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

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

// Falling prices move down and rising ones up. The unchanged dollars are a
// shared prefix, so only the digits that change move.
export function TickerDemo({
  motion = tickerMotion,
  paused = false,
  theme = "dark",
}: {
  motion?: Omit<GustProps, "value">;
  paused?: boolean;
  theme?: "dark" | "light";
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const stopped = paused || prefersReducedMotion;
  const [data, setData] = useState<LivelinePoint[]>([]);
  const [priceIndex, setPriceIndex] = useState(0);

  useEffect(() => {
    const now = Date.now() / 1000;
    const history = [...tickerPrices.slice(1), tickerPrices[0]];

    setData(
      history.map((value, index) => ({ time: now - (history.length - 1 - index) * 0.65, value })),
    );
  }, []);

  useEffect(() => {
    if (stopped) return undefined;

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
  }, [stopped, priceIndex]);

  const price = tickerPrices[priceIndex];
  const previous = tickerPrices[(priceIndex + tickerPrices.length - 1) % tickerPrices.length];
  const up = price >= previous;

  return (
    <div className="absolute inset-0">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 opacity-35"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to right, black 0, black calc(100% - 40px), transparent 100%)",
        }}
      >
        <Liveline
          data={data}
          value={price}
          theme={theme}
          color={up ? "#2c9d62" : "#d84a4a"}
          window={74}
          grid={false}
          badge={false}
          momentum={false}
          fill
          guides={false}
          scrub={false}
          pulse={false}
          paused={stopped}
          lineWidth={1.5}
          lerpSpeed={0.12}
          padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          cursor="default"
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {/* The badge tints itself from its own text color. */}
        <span
          className={`flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors duration-300 motion-reduce:transition-none ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          style={{
            backgroundColor:
              "color-mix(in oklab, currentColor 12%, var(--surface-raised, var(--card, #111)))",
          }}
          aria-label={`Simulated stock price, $${price.toFixed(2)}`}
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${up ? "" : "rotate-180"}`}
          >
            <path
              d="m17.794,12.5L12.598,3.5c-.542-.939-1.514-1.5-2.598-1.5s-2.056.561-2.598,1.5L2.206,12.5c-.542.938-.543,2.061,0,3,.542.939,1.514,1.5,2.598,1.5h10.393c1.084,0,2.056-.561,2.598-1.5.542-.939.542-2.062,0-3Z"
              fill="currentColor"
            />
          </svg>
          <Gust
            value={`$${price.toFixed(2)}`}
            {...motion}
            down={motion.down ?? !up}
            className="text-xl font-semibold tabular-nums"
          />
        </span>
      </div>
    </div>
  );
}

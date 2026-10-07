"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Gust } from "@maniktherana/gust";

const compassPoints = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const windMotion = {
  duration: 280,
  exitDuration: 180,
  stagger: 0,
  entranceOvershoot: 0,
  entranceHeight: 40,
  exitHeight: 40,
  exitBlur: 1,
  scale: false,
};
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

function compassPoint(bearing: number) {
  const normalized = ((bearing % 360) + 360) % 360;

  return compassPoints[Math.round(normalized / 45) % compassPoints.length] ?? "N";
}

function drift(value: number, spread: number) {
  return value + (Math.random() * 2 - 1) * spread;
}

// Wind is named for where it comes from and blows toward bearing + 180°. In
// Gust's screen angles (0° right, 90° down) that is bearing + 90°, so the
// characters travel with the wind. The bearing is never wrapped to 0–360, so
// the arrow always turns the short way round.
export function WindExample({ paused = false }: { paused?: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [wind, setWind] = useState({ bearing: 45, speed: 14 });
  const travel = wind.bearing + 90;

  useEffect(() => {
    if (paused || prefersReducedMotion) return undefined;

    const timer = window.setInterval(() => {
      setWind((current) => ({
        bearing: Math.round(drift(current.bearing, 70)),
        speed: Math.round(Math.min(28, Math.max(3, drift(current.speed, 5)))),
      }));
    }, 2600);

    return () => window.clearInterval(timer);
  }, [paused, prefersReducedMotion]);

  return (
    <div className="grid w-[228px] grid-cols-[96px_112px] items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-24" aria-hidden="true">
        <circle cx={50} cy={50} r={44} fill="none" className="stroke-foreground/20" />
        {Array.from({ length: 24 }, (_, index) => (
          <line
            key={index}
            x1={50}
            y1={8}
            x2={50}
            y2={index % 6 === 0 ? 14 : 11}
            className="stroke-muted-foreground"
            strokeWidth={index % 6 === 0 ? 1.5 : 1}
            transform={`rotate(${index * 15} 50 50)`}
          />
        ))}
        <text x={50} y={30} textAnchor="middle" className="fill-muted-foreground text-[12px]">
          N
        </text>
        {/* Drawn pointing south, the way a north wind blows. */}
        <g
          style={{
            transform: `rotate(${wind.bearing}deg)`,
            transformBox: "view-box",
            transformOrigin: "50px 50px",
            transition: prefersReducedMotion
              ? "none"
              : "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <path
            d="M50 30 L50 70 M43 62 L50 70 L57 62"
            fill="none"
            className="stroke-foreground"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      <div className="flex w-28 flex-col gap-1">
        <span className="flex items-baseline gap-2 text-3xl font-medium tracking-tight tabular-nums">
          <span className="inline-flex w-[2ch] shrink-0 justify-end">
            <Gust
              value={String(wind.speed)}
              enterAngle={travel}
              exitAngle={travel}
              {...windMotion}
            />
          </span>
          <span>mph</span>
        </span>
        <span className="flex items-baseline gap-1 text-sm text-muted-foreground">
          <span>from</span>
          <span className="inline-flex w-[3ch]">
            <Gust
              value={compassPoint(wind.bearing)}
              enterAngle={travel}
              exitAngle={travel}
              {...windMotion}
            />
          </span>
        </span>
      </div>
    </div>
  );
}

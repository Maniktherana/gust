"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";

type Motion = Omit<GustProps, "value">;

export const downloadMotion: Motion = {
  duration: 320,
  exitDuration: 320,
  stagger: 20,
  enterAngle: -90,
  exitAngle: -90,
  entranceOvershoot: 8,
  entranceHeight: 100,
  exitHeight: 90,
  blur: true,
  exitBlur: 4,
  entranceScale: 1.1,
  exitScale: 0.4,
  scale: true,
  preservePrefix: true,
};

export const downloadNumberMotion: Motion = {
  ...downloadMotion,
  entranceOvershoot: 0,
  stagger: 0,
};

const reducedMotionOverrides: Motion = {
  duration: 120,
  exitDuration: 80,
  stagger: 0,
  entranceOvershoot: 0,
  entranceHeight: 0,
  exitHeight: 0,
  blur: false,
  exitBlur: 0,
  scale: false,
};

const downloadSteps = 40;
const transferInterval = 125;
const restartDelay = 1000;
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

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

type DownloadState = {
  phase: "idle" | "downloading" | "complete";
  steps: number;
  touched: boolean;
};

function DownloadStateIcon({
  phase,
  running,
}: {
  phase: DownloadState["phase"];
  running: boolean;
}) {
  const arrowClipId = `${useId().replace(/:/g, "")}-download-arrow`;

  return (
    <span
      aria-hidden="true"
      className="gust-download-icon grid size-5 shrink-0 place-items-center overflow-visible"
      data-phase={phase}
      data-running={running}
    >
      <style>{`
        .gust-download-icon .gust-download-layer {
          transform-box: view-box;
          transform-origin: center;
          transition: opacity 300ms cubic-bezier(0.2, 0, 0, 1),
            scale 300ms cubic-bezier(0.2, 0, 0, 1),
            filter 300ms cubic-bezier(0.2, 0, 0, 1);
        }
        .gust-download-icon .gust-download-symbol {
          opacity: 1;
          scale: 1;
          filter: blur(0);
        }
        .gust-download-icon .gust-download-check {
          opacity: 0;
          scale: 0.25;
          filter: blur(4px);
        }
        .gust-download-icon[data-phase="complete"] .gust-download-symbol {
          opacity: 0;
          scale: 0.25;
          filter: blur(4px);
        }
        .gust-download-icon[data-phase="complete"] .gust-download-check {
          opacity: 1;
          scale: 1;
          filter: blur(0);
        }
        .gust-download-icon[data-phase="downloading"] .gust-download-arrow,
        .gust-download-icon[data-phase="complete"] .gust-download-arrow {
          animation: gust-download-fall 1100ms linear infinite;
          animation-play-state: paused;
        }
        .gust-download-icon[data-running="true"] .gust-download-arrow {
          animation-play-state: running;
        }
        @keyframes gust-download-fall {
          0% { transform: translateY(-16px); }
          90%, 100% { transform: translateY(22px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gust-download-icon[data-phase] .gust-download-layer {
            scale: 1;
            filter: none;
            transition: opacity 120ms ease;
          }
          .gust-download-icon[data-phase] .gust-download-arrow {
            animation: none;
            transform: none;
            opacity: 1;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        className="gust-download-layer gust-download-symbol col-start-1 row-start-1 size-5 overflow-visible"
      >
        <defs>
          <clipPath id={arrowClipId}>
            <rect width={24} height={21} />
          </clipPath>
        </defs>
        {/* Exact paths from Lucide's Download icon; only the arrow moves. */}
        <g clipPath={`url(#${arrowClipId})`}>
          <g className="gust-download-arrow">
            <path d="M12 15V3" />
            <path d="m7 10 5 5 5-5" />
          </g>
        </g>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      </svg>
      <svg
        viewBox="0 0 20 20"
        focusable="false"
        className="gust-download-layer gust-download-check col-start-1 row-start-1 size-5"
      >
        {/* Exact IconBadgeCheck path from components/icons.tsx, kept local for copying. */}
        <path
          d="m17.999,10c0-1.097-.567-2.113-1.465-2.707.215-1.054-.103-2.174-.878-2.95-.775-.776-1.896-1.094-2.95-.878-.593-.897-1.609-1.464-2.706-1.464s-2.113.567-2.706,1.464c-1.053-.216-2.174.102-2.95.878s-1.093,1.896-.878,2.949c-.897.593-1.465,1.61-1.465,2.707s.567,2.113,1.465,2.707c-.215,1.054.103,2.174.878,2.95s1.898,1.092,2.95.878c.593.897,1.609,1.464,2.706,1.464s2.113-.568,2.706-1.465c1.059.214,2.176-.103,2.95-.878.776-.776,1.094-1.896.878-2.95.897-.593,1.465-1.609,1.465-2.707Zm-4.218-1.875l-4,5c-.178.222-.442.358-.726.374-.019,0-.037.001-.056.001-.265,0-.52-.105-.707-.293l-2-2c-.391-.391-.391-1.023,0-1.414s1.023-.391,1.414,0l1.21,1.21,3.302-4.127c.347-.43.975-.502,1.406-.156.431.345.501.974.156,1.405Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

// The button becomes the transfer's progress display, then starts another
// transfer after holding completion for one second.
export function DownloadExample({
  paused = false,
  motion = downloadMotion,
  numberMotion = downloadNumberMotion,
}: {
  paused?: boolean;
  motion?: Motion;
  numberMotion?: Motion;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const hidden = useSyncExternalStore(
    subscribeToVisibility,
    () => document.hidden,
    () => false,
  );
  const [state, setState] = useState<DownloadState>({
    phase: "idle",
    steps: 0,
    touched: false,
  });
  const autoplayPaused = reducedMotion && !state.touched;
  const downloading = state.phase === "downloading" && !autoplayPaused;
  const percent = Math.round((state.steps / downloadSteps) * 100);
  const labelMotion = reducedMotion ? { ...motion, ...reducedMotionOverrides } : motion;
  const progressMotion = reducedMotion
    ? { ...numberMotion, ...reducedMotionOverrides }
    : numberMotion;
  const label =
    state.phase === "complete" ? "Downloaded" : state.phase === "idle" ? "Download" : "Downloading";
  const action =
    state.phase === "complete" ? "Download again" : downloading ? "Downloading" : "Download";

  useEffect(() => {
    if (paused || hidden || autoplayPaused || state.touched || state.phase !== "idle")
      return undefined;

    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, phase: "downloading" }));
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [autoplayPaused, hidden, paused, state.phase, state.touched]);

  useEffect(() => {
    if (paused || hidden || autoplayPaused || state.phase !== "downloading") return undefined;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.phase !== "downloading") return current;
        const steps = Math.min(downloadSteps, current.steps + 1);
        return {
          ...current,
          steps,
          phase: steps === downloadSteps ? "complete" : "downloading",
        };
      });
    }, transferInterval);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, hidden, paused, state.phase]);

  useEffect(() => {
    if (paused || hidden || reducedMotion || state.phase !== "complete") return undefined;

    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, phase: "downloading", steps: 0 }));
    }, restartDelay);
    return () => window.clearTimeout(timer);
  }, [hidden, paused, reducedMotion, state.phase]);

  const controlDownload = () => {
    setState((current) => {
      if (current.phase === "downloading" && !(reducedMotion && !current.touched)) return current;
      return { phase: "downloading", steps: 0, touched: true };
    });
  };

  return (
    <button
      type="button"
      onClick={controlDownload}
      disabled={downloading}
      aria-label={state.phase === "idle" ? action : `${action}, ${percent}% downloaded`}
      title={action}
      className="relative flex h-12 w-64 max-w-full items-center justify-between gap-3 overflow-visible rounded-xl bg-foreground/5 px-4 text-sm font-medium ring-1 ring-foreground/10 transition-[background-color,scale] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] enabled:hover:bg-foreground/10 enabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-foreground/50 disabled:cursor-default motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      >
        <span
          className="block h-full w-full origin-left bg-foreground/10"
          style={{
            transform: `scaleX(${state.steps / downloadSteps})`,
            transition:
              reducedMotion || state.steps === 0
                ? "none"
                : `transform ${transferInterval}ms linear`,
          }}
        />
      </span>
      <span className="relative flex min-w-0 items-center gap-2">
        <DownloadStateIcon
          phase={state.phase}
          running={downloading && !paused && !hidden && !reducedMotion}
        />
        <span className="inline-flex h-6 items-center">
          <Gust value={label} {...labelMotion} />
        </span>
      </span>
      {state.phase !== "idle" ? (
        <span className="relative flex shrink-0 items-center tabular-nums">
          <span className="inline-flex w-[3ch] justify-end">
            <Gust value={String(percent)} {...progressMotion} />
          </span>
          <span>%</span>
        </span>
      ) : null}
    </button>
  );
}

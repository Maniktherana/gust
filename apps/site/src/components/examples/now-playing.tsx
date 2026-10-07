"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";

import { PlaybackIcon, SkipIcon } from "./playback-icon";

const tracks = [
  { artist: "Stratus", hue: 250, length: 214, title: "Tailwind" },
  { artist: "Low Pressure", hue: 20, length: 187, title: "Crosswind" },
  { artist: "The Doldrums", hue: 160, length: 241, title: "Updraft" },
  { artist: "Cirrus Club", hue: 300, length: 199, title: "Jet Stream" },
];
// Browse tracks until someone uses the player, then leave track choice to them.
const autoSkipSeconds = 6;
export const playerMotion: Omit<GustProps, "value"> = {
  duration: 440,
  exitDuration: 400,
  stagger: 20,
  entranceOvershoot: 10,
  entranceHeight: 90,
  entranceScale: 1.15,
  exitHeight: 90,
  exitBlur: 4,
  blur: true,
  scale: true,
};
export const playerNumberMotion: Omit<GustProps, "value"> = {
  duration: 320,
  exitDuration: 320,
  stagger: 0,
  entranceOvershoot: 8,
  entranceHeight: 100,
  exitHeight: 90,
  exitBlur: 4,
  blur: true,
  scale: true,
};
const controlClassName =
  "grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-[color,transform] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 motion-reduce:transition-none motion-reduce:active:scale-100";

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

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Next sends the title and artist out to the left and previous to the right,
// like a carousel. The elapsed time only moves the digits that change.
export function NowPlayingExample({
  paused = false,
  motion = playerMotion,
  numberMotion = playerNumberMotion,
}: {
  paused?: boolean;
  motion?: Omit<GustProps, "value">;
  numberMotion?: Omit<GustProps, "value">;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState({
    elapsed: 41,
    forward: true,
    index: 0,
    interacted: false,
    listened: 0,
    playing: true,
  });
  const track = tracks[state.index] ?? tracks[0];
  const angle = state.forward ? 180 : 0;
  const reduced = prefersReducedMotion
    ? {
        duration: 120,
        exitDuration: 100,
        stagger: 0,
        entranceOvershoot: 0,
        entranceHeight: 0,
        exitHeight: 0,
        blur: false,
        scale: false,
      }
    : {};
  const smallText = { ...numberMotion, ...reduced };

  const skip = (forward: boolean) =>
    setState((current) => ({
      ...current,
      elapsed: 0,
      forward,
      index: (current.index + (forward ? 1 : tracks.length - 1)) % tracks.length,
      interacted: true,
      listened: 0,
    }));

  useEffect(() => {
    if (paused || prefersReducedMotion || !state.playing) return undefined;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (!current.interacted && current.listened + 1 >= autoSkipSeconds) {
          return {
            ...current,
            elapsed: 0,
            forward: true,
            index: (current.index + 1) % tracks.length,
            listened: 0,
          };
        }

        const length = tracks[current.index].length;
        const elapsed = Math.min(current.elapsed + 1, length);
        return {
          ...current,
          elapsed,
          listened: current.listened + 1,
          playing: elapsed < length,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [paused, prefersReducedMotion, state.playing]);

  return (
    <div className="flex w-full max-w-64 flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="size-14 shrink-0 rounded-lg transition-colors duration-[280ms] motion-reduce:transition-none"
          style={{ backgroundColor: `oklch(0.62 0.13 ${track.hue})` }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="block h-6 text-base font-medium">
            <Gust
              value={track.title}
              {...motion}
              {...reduced}
              enterAngle={angle}
              exitAngle={angle}
            />
          </span>
          <span className="block h-5 text-sm text-muted-foreground">
            <Gust
              value={track.artist}
              {...motion}
              {...reduced}
              enterAngle={angle}
              exitAngle={angle}
            />
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="h-1 overflow-hidden rounded-full bg-foreground/10">
          <span
            key={state.index}
            className="block h-full w-full origin-left rounded-full bg-foreground"
            style={{
              transform: `scaleX(${state.elapsed / track.length})`,
              transition:
                state.elapsed > 0 && state.playing && !paused && !prefersReducedMotion
                  ? "transform 1000ms linear"
                  : "none",
            }}
          />
        </span>
        <span className="flex justify-between text-[13px] text-muted-foreground tabular-nums">
          <span className="inline-block h-5 w-[4ch]">
            <Gust value={clock(state.elapsed)} {...smallText} />
          </span>
          <span className="inline-block h-5 w-[4ch]">
            <Gust value={clock(track.length)} {...smallText} />
          </span>
        </span>
      </div>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          aria-label="Previous track"
          onClick={() => skip(false)}
          className={controlClassName}
        >
          <SkipIcon direction="previous" className="size-4" />
        </button>
        <button
          type="button"
          aria-label={state.playing ? "Pause playback" : "Play"}
          onClick={() =>
            setState((current) => ({
              ...current,
              elapsed: current.elapsed === tracks[current.index].length ? 0 : current.elapsed,
              interacted: true,
              playing: !current.playing,
            }))
          }
          className={`${controlClassName} bg-foreground/5 text-foreground`}
        >
          <PlaybackIcon playing={state.playing} className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next track"
          onClick={() => skip(true)}
          className={controlClassName}
        >
          <SkipIcon direction="next" className="size-4" />
        </button>
      </div>
    </div>
  );
}

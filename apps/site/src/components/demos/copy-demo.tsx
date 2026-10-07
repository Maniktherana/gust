"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Gust, type GustProps } from "@maniktherana/gust";

export const copyMotion = {
  blur: false,
  entranceOvershoot: 0,
  entranceScale: 1,
  exitDuration: 360,
  exitHeight: 100,
  exitScale: 0.6,
  stagger: 40,
} satisfies Omit<GustProps, "value">;

const glyph =
  "col-start-1 row-start-1 size-4 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";
const shown = "scale-100 opacity-100 blur-none";
const hidden = "scale-25 opacity-0 blur-[4px]";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToPlayback(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function CopyIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="m13,7h2c1.105,0,2,.895,2,2v6c0,1.105-.895,2-2,2h-6c-1.105,0-2-.895-2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="m17.999,10c0-1.097-.567-2.113-1.465-2.707.215-1.054-.103-2.174-.878-2.95-.775-.776-1.896-1.094-2.95-.878-.593-.897-1.609-1.464-2.706-1.464s-2.113.567-2.706,1.464c-1.053-.216-2.174.102-2.95.878s-1.093,1.896-.878,2.949c-.897.593-1.465,1.61-1.465,2.707s.567,2.113,1.465,2.707c-.215,1.054.103,2.174.878,2.95s1.898,1.092,2.95.878c.593.897,1.609,1.464,2.706,1.464s2.113-.568,2.706-1.465c1.059.214,2.176-.103,2.95-.878.776-.776,1.094-1.896.878-2.95.897-.593,1.465-1.609,1.465-2.707Zm-4.218-1.875l-4,5c-.178.222-.442.358-.726.374-.019,0-.037.001-.056.001-.265,0-.52-.105-.707-.293l-2-2c-.391-.391-.391-1.023,0-1.414s1.023-.391,1.414,0l1.21,1.21,3.302-4.127c.347-.43.975-.502,1.406-.156.431.345.501.974.156,1.405Z"
        fill="currentColor"
      />
    </svg>
  );
}

// "Cop" is a shared prefix of "Copy" and "Copied", so only the ending changes
// while the icon swaps beside it.
export function CopyDemo({
  motion = copyMotion,
  paused = false,
  text = "Gust copied this text",
}: {
  motion?: Omit<GustProps, "value">;
  paused?: boolean;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const autoplayPaused = useSyncExternalStore(
    subscribeToPlayback,
    () => document.hidden || window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

  useEffect(() => {
    if (paused || autoplayPaused) return undefined;

    // Preview the feedback without writing to the clipboard. Real copying
    // remains a user action, and restarts the feedback timer.
    resetTimer.current = window.setTimeout(() => setCopied(!copied), copied ? 1000 : 1600);
    return () => window.clearTimeout(resetTimer.current ?? undefined);
  }, [autoplayPaused, copied, paused]);

  useEffect(() => () => window.clearTimeout(resetTimer.current ?? undefined), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    setCopied(true);
    window.clearTimeout(resetTimer.current ?? undefined);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy"}
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background pr-2.5 pl-2 text-sm font-medium shadow-xs transition-[background-color,scale] duration-100 hover:bg-accent active:scale-[0.98] dark:bg-input/30 dark:hover:bg-input/50"
    >
      <span className="grid place-items-center">
        <CopyIcon className={`${glyph} ${copied ? hidden : shown}`} />
        <CheckIcon className={`${glyph} ${copied ? shown : hidden}`} />
      </span>
      <Gust value={copied ? "Copied" : "Copy"} {...motion} />
    </button>
  );
}

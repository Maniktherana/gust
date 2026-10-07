"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gust } from "@maniktherana/gust";

// Each symbol is one grapheme, including the keycap 7 and its combining marks.
const symbols = ["🍒", "🍋", "🔔", "⭐️", "🍀", "7️⃣"];
const reelCount = 3;
const spinTickMs = 80;
const firstStopMs = 700;
const stopGapMs = 380;
const autoSpinMs = 4200;
const smallText = { entranceHeight: 60, exitBlur: 1, exitHeight: 60 };

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)] ?? "🍒";
}

function verdict(reels: string[]) {
  const distinct = new Set(reels).size;

  if (distinct === 1) return "Jackpot";
  if (distinct === 2) return "Two of a kind";

  return "Try again";
}

// Reels fall fast while spinning, then land with a bounce. Each reel window
// clips on purpose, so symbols drop out of view like a real reel.
export function SlotsExample({ paused = false }: { paused?: boolean }) {
  const [reels, setReels] = useState(["🍒", "🔔", "7️⃣"]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const stopTimers = useRef<number[]>([]);
  const isSpinning = spinning.some(Boolean);

  // Start every reel, then stop them one by one from the left.
  const spin = useCallback(() => {
    setSpinning(Array.from({ length: reelCount }, () => true));
    stopTimers.current = Array.from({ length: reelCount }, (_, reel) =>
      window.setTimeout(
        () =>
          setSpinning((current) => current.map((value, index) => (index === reel ? false : value))),
        firstStopMs + reel * stopGapMs,
      ),
    );
  }, []);

  useEffect(() => () => stopTimers.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    if (!isSpinning) return undefined;

    const ticker = window.setInterval(() => {
      setReels((current) =>
        current.map((symbol, index) => (spinning[index] ? randomSymbol() : symbol)),
      );
    }, spinTickMs);

    return () => window.clearInterval(ticker);
  }, [isSpinning, spinning]);

  useEffect(() => {
    if (paused || isSpinning) return undefined;

    const timer = window.setTimeout(spin, autoSpinMs);

    return () => window.clearTimeout(timer);
  }, [isSpinning, paused, spin]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {reels.map((symbol, index) => (
          <span
            key={index}
            className="grid size-16 place-items-center overflow-hidden rounded-xl bg-foreground/5 text-3xl"
          >
            <Gust
              value={symbol}
              down
              duration={spinning[index] ? 160 : 520}
              exitDuration={140}
              entranceHeight={110}
              exitHeight={110}
              entranceOvershoot={spinning[index] ? 0 : 18}
              entranceScale={spinning[index] ? 1 : 1.15}
              exitScale={0.8}
              exitBlur={2}
            />
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-right text-sm text-muted-foreground">
          <Gust value={isSpinning ? "Spinning…" : verdict(reels)} {...smallText} />
        </span>
        <button
          type="button"
          disabled={isSpinning}
          onClick={spin}
          className="h-8 rounded-lg bg-foreground/10 px-3 text-sm font-medium transition-[background-color,opacity,scale] duration-150 hover:bg-foreground/15 active:scale-[0.97] disabled:opacity-50"
        >
          Spin
        </button>
      </div>
    </div>
  );
}

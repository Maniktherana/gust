"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const message = "gust of fresh air";
const noise = "#%&*+=?@<>/{}[]~^";
const stepMs = 110;
const holdMs = 2400;

// Spaces stay spaces, so the shape of the words shows through the noise.
function scramble(text: string) {
  return Array.from(text, (character) =>
    character === " " ? " " : (noise[Math.floor(Math.random() * noise.length)] ?? "#"),
  ).join("");
}

// The decoded part is a shared prefix between steps, so it holds still while
// the noise after it shimmers.
export function DecryptExample({ paused = false }: { paused?: boolean }) {
  const [revealed, setRevealed] = useState(0);
  const [tail, setTail] = useState(() => message.replace(/\S/g, "#"));
  const done = revealed === message.length;

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setTimeout(
      () => {
        const next = done ? 0 : revealed + 1;

        setRevealed(next);
        setTail(scramble(message.slice(next)));
      },
      done ? holdMs : stepMs,
    );

    return () => window.clearTimeout(timer);
  }, [done, paused, revealed]);

  return (
    <span className="font-mono text-2xl font-medium">
      <Gust
        value={message.slice(0, revealed) + tail}
        duration={240}
        exitDuration={180}
        stagger={4}
        entranceHeight={50}
        entranceOvershoot={0}
        entranceScale={1}
        exitHeight={50}
        exitBlur={1.5}
      />
    </span>
  );
}

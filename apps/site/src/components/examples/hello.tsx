"use client";

import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";

const greetings = [
  { language: "English", text: "Hello" },
  { language: "French", text: "Bonjour" },
  { language: "Greek", text: "Γειά σου" },
  { language: "Russian", text: "Привет" },
  { language: "Japanese", text: "こんにちは" },
  { language: "Korean", text: "안녕하세요" },
  { language: "Portuguese", text: "Olá" },
  { language: "Emoji", text: "👋🏽" },
];
const smallText = { entranceHeight: 60, exitBlur: 1, exitHeight: 60 };

// Gust splits text into graphemes, so accented letters and the waving hand
// with its skin tone each move as one character.
export function HelloExample({ paused = false }: { paused?: boolean }) {
  const [index, setIndex] = useState(0);
  const greeting = greetings[index] ?? greetings[0];

  useEffect(() => {
    if (paused) return undefined;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % greetings.length),
      1900,
    );

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-4xl font-medium tracking-tight">
        <Gust value={greeting.text} />
      </span>
      <span className="text-sm text-muted-foreground">
        <Gust value={greeting.language} {...smallText} />
      </span>
    </div>
  );
}

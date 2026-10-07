// Copy prompts include the rendered component's source and its dependencies.
import tickerSource from "@/components/demos/ticker-demo.tsx?raw";
import { componentPrompt } from "@/lib/prompts";
import livelinePatch from "../../../patches/liveline@0.0.7.patch?raw";

import { DownloadExample, downloadMotion, downloadNumberMotion } from "./download";
import downloadSource from "./download.tsx?raw";
import type { Example } from "./example-card";
import { FlightExample, flightMotion, flightNumberMotion } from "./flight";
import flightSource from "./flight.tsx?raw";
import { GuestsExample, guestsMotion } from "./guests";
import guestsSource from "./guests.tsx?raw";
import { LivePriceExample, livePriceMotion } from "./live-price";
import livePriceSource from "./live-price.tsx?raw";
import { ColorSwatchesExample, colorSwatchesMotion } from "./color-swatches";
import colorSwatchesSource from "./color-swatches.tsx?raw";

// Inline the ticker implementation so the copied graph works as one file in another project.
const standaloneLivePrice = [
  tickerSource,
  livePriceSource
    .replace('"use client";', "")
    .replace('import type { GustProps } from "@maniktherana/gust";', "")
    .replace('import { TickerDemo } from "@/components/demos/ticker-demo";', "")
    .trim(),
].join("\n\n");

const livePriceSetup = `\n\nThis graph uses a small patch to liveline 0.0.7 to hide its guides and time axis. Install exactly liveline@0.0.7, save the diff below as a package patch, and apply it using the project's package manager (for example Bun patchedDependencies, pnpm patch, or patch-package). The diff paths are relative to the liveline package root. Keep guides={false} in the component. Run the typecheck and build after applying the patch.\n\n\`\`\`diff\n${livelinePatch.trim()}\n\`\`\``;

const entries: (Omit<Example, "prompt"> & { source: string; dependencies?: string[] })[] = [
  {
    component: FlightExample,
    dependencies: ["cobe"],
    fullBleed: true,
    id: "flight",
    motion: flightMotion,
    motionTitle: "Flight · waypoint",
    profiles: [{ prop: "numberMotion", title: "Flight · distance", motion: flightNumberMotion }],
    source: flightSource,
    span: 2 as const,
    title: "Flight",
  },
  {
    component: LivePriceExample,
    dependencies: ["liveline@0.0.7"],
    fullBleed: true,
    id: "live-price",
    motion: livePriceMotion,
    source: standaloneLivePrice,
    title: "Live price",
  },
  {
    component: GuestsExample,
    dependencies: ["lucide-react"],
    id: "guests",
    motion: guestsMotion,
    source: guestsSource,
    title: "Guest count",
  },
  {
    component: ColorSwatchesExample,
    id: "color-swatches",
    motion: colorSwatchesMotion,
    source: colorSwatchesSource,
    title: "Color picker",
  },
  {
    component: DownloadExample,
    id: "download",
    motion: downloadMotion,
    motionTitle: "Download · label",
    profiles: [
      { prop: "numberMotion", title: "Download · percentage", motion: downloadNumberMotion },
    ],
    source: downloadSource,
    title: "File download",
  },
];

export const examples: Example[] = entries.map(({ dependencies, source, ...example }) => ({
  ...example,
  prompt:
    componentPrompt({ dependencies, source, title: example.title }) +
    (example.id === "live-price" ? livePriceSetup : ""),
}));

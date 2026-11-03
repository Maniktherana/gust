import { DEFAULT_MOTION } from "@maniktherana/gust";
import { componentPrompt } from "@/lib/prompts";
import { getExampleSource } from "@/lib/example-sources";
import { DownloadExample } from "./download";
import type { Example } from "./example-card";
import { GuestsExample } from "./guests";
import { LivePriceExample } from "./live-price";
import { ColorSwatchesExample } from "./color-swatches";

const entries: Omit<Example, "prompt">[] = [
  {
    component: LivePriceExample,
    fullBleed: true,
    id: "live-price",
    motion: DEFAULT_MOTION,
    title: "Live price",
  },
  {
    component: GuestsExample,
    id: "guests",
    motion: DEFAULT_MOTION,
    title: "Guest count",
  },
  {
    component: ColorSwatchesExample,
    id: "color-swatches",
    motion: DEFAULT_MOTION,
    title: "Color picker",
  },
  {
    component: DownloadExample,
    id: "download",
    motion: DEFAULT_MOTION,
    motionTitle: "Download · label",
    profiles: [{ prop: "numberMotion", title: "Download · percentage", motion: DEFAULT_MOTION }],
    title: "File download",
  },
];

export const examples: Example[] = entries.map((example) => ({
  ...example,
  prompt: componentPrompt({ source: getExampleSource(example.id), title: example.title }),
}));

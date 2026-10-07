import type { GustProps } from "@maniktherana/gust";

// Gust's defaults suit display text. Blur is in pixels and does not scale with
// font size, so 12–14px text needs less of it, and a shorter travel.
export const smallTextMotion = {
  entranceHeight: 60,
  exitBlur: 1,
  exitHeight: 60,
} satisfies Omit<GustProps, "value">;

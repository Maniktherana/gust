export const agentGuideUrl = "https://gust.manikrana.dev/gust.md";

export const agentInstallPrompt = `Add Gust to my React project.

Install from npm:
npm install @maniktherana/gust

import { Gust } from "@maniktherana/gust";

Use <Gust>{text}</Gust> to animate an existing changing text value. Gust includes its styles; no stylesheet import is needed.

API and examples: ${agentGuideUrl}`;

export function componentPrompt({ source, title }: { source: string; title: string }) {
  return `Add the "${title}" example from Gust to my React project. Adapt the following complete source to my project's structure and styling.\n\n${source}`;
}

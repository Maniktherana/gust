export const agentGuideUrl = "https://gust.manikrana.dev/gust.md";

export const agentInstallPrompt = `Gust setup reference

Gust animates changes to a React text value.
Package: @maniktherana/gust
Install: bun add @maniktherana/gust
Stylesheet (once at the app root): @maniktherana/gust/styles.css

import { Gust } from "@maniktherana/gust";
import "@maniktherana/gust/styles.css";

<Gust value={text} />

Source install: bunx --bun shadcn@latest add https://gust.manikrana.dev/r/gust.json
Source import: import { Gust } from "@/components/ui/gust";
The shadcn install includes the styles.

API and examples: ${agentGuideUrl}`;

export function componentPrompt({
  dependencies = [],
  source,
  title,
}: {
  dependencies?: string[];
  source: string;
  title: string;
}) {
  const packages = ["@maniktherana/gust", ...dependencies].join(", ");

  return `${title} — Gust example

Dependencies: ${packages}
Stylesheet (once at the app root): @maniktherana/gust/styles.css
Styling: Tailwind CSS with shadcn color tokens.

\`\`\`tsx
${source.trim()}
\`\`\`

Gust API: ${agentGuideUrl}`;
}

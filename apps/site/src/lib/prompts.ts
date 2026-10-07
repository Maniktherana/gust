// Prompts shown on the home page. Each one points the agent at the agent guide
// so it reads the real API before writing code.

export const agentGuideUrl = "https://gust.manikrana.dev/gust.md";

export const agentInstallPrompt = `Add Gust (@maniktherana/gust) to this project. Read ${agentGuideUrl} first. Detect the package manager, install the package, and import "@maniktherana/gust/styles.css" once at the app root. Then find one short label in this app that changes between states, such as a save button or a status badge, and render it with <Gust value={label} />. Keep the state where it already lives. Run the typecheck and build when you are done.`;

export const prompts = [
  {
    prompt: `Read ${agentGuideUrl}. Find the save button in my settings form; its label goes Save → Saving… → Saved. Render that label with Gust so each change animates. Keep the state in the button's component. Gust only animates when value changes, so do not add timers for it.`,
    title: "Animate a label that changes state",
  },
  {
    prompt: `Read ${agentGuideUrl}. Use Gust for the price in my price ticker. Format the number into a string before passing it as value, add tabular-nums to its className, and set down when the new price is lower than the previous one, so falling prices move down. Keep updates at least 500ms apart.`,
    title: "Animate a live number",
  },
  {
    prompt: `Read ${agentGuideUrl}. Tune my 13px Gust labels with a shared label profile. Keep character stagger and visible travel; reduce exitBlur only if the text becomes hard to read. Use a separate profile with stagger={0} for live counters. Keep fixed units outside Gust, use the regular font with tabular numbers, and inspect entry and exit screenshots for clipping.`,
    title: "Tune Gust for small text",
  },
  {
    prompt: `Read ${agentGuideUrl}. Build a 3×3 color swatch picker. Show the selected hex value with Gust above the grid. Let clicks select a swatch, and select a different swatch every two seconds while visible. Keep the selection immediate, preserve the label's character stagger and blur, and provide a reduced-motion version.`,
    title: "Build something new",
  },
] as const;

// What the copy button on every demo copies: the component's own source and
// the setup it needs, so an agent adds exactly that component.
export function componentPrompt({
  dependencies = [],
  source,
  title,
}: {
  dependencies?: string[];
  source: string;
  title: string;
}) {
  const packages = ["@maniktherana/gust", ...dependencies].join(" and ");

  return `Add the ${title} component below to my project. It animates text with Gust (@maniktherana/gust).

1. Install ${packages} with this project's package manager.
2. Import "@maniktherana/gust/styles.css" once at the app root. If the project uses the shadcn CLI, you can instead run npx shadcn@latest add https://gust.manikrana.dev/r/gust.json and import Gust from "@/components/ui/gust".
3. Save the code as its own component file and render it where I ask.

The styles use Tailwind CSS with shadcn color tokens such as foreground and muted-foreground. If this project styles things another way, translate the classes and keep the Gust props as they are.

\`\`\`tsx
${source.trim()}
\`\`\`

Gust API and common mistakes: ${agentGuideUrl}`;
}

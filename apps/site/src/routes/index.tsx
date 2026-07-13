import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { AnatomyFigure } from "@/components/anatomy";
import { CodeBlock } from "@/components/code-block";
import { DemoGrid } from "@/components/demos";
import { IconBadgeCheck, IconCloneFilled } from "@/components/icons";
import { SiteShell } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  Gust,
  WORD_HOLD_MS,
} from "@gust/core";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

const installCommand = "bunx shadcn@latest add maniktherana/gust/gust";

const heroWords = ["a gust of wind.", "a gust of words.", "a gust of motion."];

const usageSnippet = `import { Gust } from "@/components/ui/gust";

// cycle a list of words
<Gust words={["a gust of wind", "a gust of words"]} />

// or drive it yourself — every change animates
<Gust text={copied ? "Copied" : "Copy"} />`;

type PropRow = {
  defaultValue: string;
  description: string;
  name: string;
};

const propRows: PropRow[] = [
  { defaultValue: '["a gust of…"]', description: "Words to cycle through.", name: "words" },
  { defaultValue: "—", description: "Controlled mode — every change animates.", name: "text" },
  { defaultValue: "—", description: "Standard CSS styles, including text color.", name: "style" },
  { defaultValue: "—", description: "Pin a specific word, disables the cycle.", name: "index" },
  { defaultValue: String(WORD_HOLD_MS), description: "Hold per word, ms.", name: "interval" },
  {
    defaultValue: String(DEFAULT_DURATION_MS),
    description: "Enter duration per character, ms.",
    name: "duration",
  },
  {
    defaultValue: String(DEFAULT_EXIT_DURATION_MS),
    description: "Exit duration per character, ms.",
    name: "exitDuration",
  },
  {
    defaultValue: String(DEFAULT_STAGGER_MS),
    description: "Delay between characters, ms.",
    name: "stagger",
  },
  {
    defaultValue: String(DEFAULT_ENTRANCE_HEIGHT),
    description: "Overshoot above the baseline.",
    name: "entranceHeight",
  },
  {
    defaultValue: String(DEFAULT_ENTRANCE_SCALE),
    description: "Peak scale mid-entrance.",
    name: "entranceScale",
  },
  {
    defaultValue: String(DEFAULT_EXIT_HEIGHT),
    description: "Upward exit travel, % of line height.",
    name: "exitHeight",
  },
  {
    defaultValue: String(DEFAULT_EXIT_SCALE),
    description: "Scale characters shrink to on exit.",
    name: "exitScale",
  },
  { defaultValue: "true", description: "Blur in and out.", name: "blur" },
  { defaultValue: "true", description: "Scale in and out.", name: "scale" },
  { defaultValue: "true", description: "Keep the shared prefix still.", name: "preservePrefix" },
  { defaultValue: '"center"', description: "Edge the text grows from.", name: "align" },
  {
    defaultValue: "—",
    description: "Classes for typography, color and spacing.",
    name: "className",
  },
];

const useFor = [
  "Button labels that confirm an action — Save, Saving…, Saved.",
  "Prices, counts and totals where only some digits change.",
  "Statuses: deploys, uploads, presence, build pipelines.",
  "Short headlines cycling through a few words.",
];

const avoidFor = [
  "Paragraphs or long sentences — it animates characters, not prose.",
  "Text that changes many times a second; the hold is clamped so updates queue up.",
  "Anything the user is in the middle of reading or editing.",
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-10 text-sm font-medium">
      {children}
    </h2>
  );
}

function InstallCommand() {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
    } catch {
      return;
    }

    setCopied(true);

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, 2000);
  };

  React.useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised py-2 pr-2 pl-5">
      <code className="font-mono text-xs sm:text-sm">
        <span className="text-muted-foreground select-none">$ </span>
        {installCommand}
      </code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy install command"}
        onClick={copy}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-[color,scale] duration-200 hover:text-foreground active:scale-[0.96]"
      >
        <span className="grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-4">
          <IconCloneFilled
            className={cn(
              "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              copied ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
            )}
          />
          <IconBadgeCheck
            className={cn(
              "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              copied ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-[4px]",
            )}
          />
        </span>
      </button>
    </div>
  );
}

function HeroPreview() {
  const [index, setIndex] = React.useState(0);
  const [cycleEpoch, setCycleEpoch] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [cycleEpoch]);

  const next = () => {
    setIndex((current) => current + 1);
    setCycleEpoch((current) => current + 1);
  };

  return (
    <div className="relative grid h-48 place-items-center overflow-hidden rounded-xl bg-surface-raised px-6 sm:h-56">
      <Gust
        data-testid="hero-gust"
        index={index}
        words={heroWords}
        className="max-w-full text-3xl font-medium tracking-tight sm:text-4xl"
      />
      <Button variant="secondary" size="xs" className="absolute right-3 bottom-3" onClick={next}>
        Next
      </Button>
    </div>
  );
}

function Home() {
  return (
    <SiteShell>
      <main className="flex flex-col gap-14 pt-2 pb-24 lg:pt-10">
        <section id="demos" className="flex scroll-mt-10 flex-col gap-3">
          <HeroPreview />
          <DemoGrid />
        </section>

        <section id="about" className="flex scroll-mt-10 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-sm font-medium">gust</h1>
            <p className="text-sm text-pretty text-muted-foreground">
              gust is a zero-added-dependency text animation for React. When a label changes,
              outgoing characters lift away and incoming ones settle in on a staggered draft — the
              shared prefix never moves, so only the difference animates. It's driven by the Web
              Animations API, respects reduced motion, and adds no animation runtime.
            </p>
          </div>
          <InstallCommand />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading id="usage">Usage</SectionHeading>
          <CodeBlock code={usageSnippet} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading id="props">Props</SectionHeading>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-normal">Prop</th>
                <th className="py-2 pr-4 font-normal">Default</th>
                <th className="py-2 font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {propRows.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-b-0">
                  <td className="py-2.5 pr-4 font-mono text-xs">{row.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                    {row.defaultValue}
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground sm:text-sm">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading id="best-practices">Best practices</SectionHeading>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">Use gust for:</h3>
              <ul className="flex flex-col gap-1.5">
                {useFor.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-pretty text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1 shrink-0 rounded-full bg-border-strong"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">Avoid gust for:</h3>
              <ul className="flex flex-col gap-1.5">
                {avoidFor.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-pretty text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1 shrink-0 rounded-full bg-border-strong"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="anatomy" className="scroll-mt-10">
          <AnatomyFigure />
        </section>
      </main>
    </SiteShell>
  );
}

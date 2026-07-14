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
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  Gust,
  WORD_HOLD_MS,
} from "@maniktherana/gust";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

const installOptions = [
  { command: "bun add @maniktherana/gust", id: "package", label: "npm" },
  {
    command: "bunx shadcn@latest add https://gust.manikrana.dev/r/gust.json",
    id: "source",
    label: "shadcn cli",
  },
] as const;

type InstallMethod = (typeof installOptions)[number]["id"];

const heroWords = ["a gust of wind.", "a gust of words.", "a gust of motion."];

const usageSnippets: Record<InstallMethod, string> = {
  package: `import { Gust } from "@maniktherana/gust";

export function GustExample() {
  return (
    <div>
      <Gust words={["a gust of wind", "a gust of words"]} />
    </div>
  );
}`,
  source: `import { Gust } from "@/components/ui/gust";

export function GustExample() {
  return (
    <div>
      <Gust words={["a gust of wind", "a gust of words"]} />
    </div>
  );
}`,
};

type PropRow = {
  defaultValue: string;
  description: string;
  name: string;
};

const propRows: PropRow[] = [
  {
    defaultValue: "-",
    description: "Controlled mode. Animates whenever this string changes.",
    name: "text",
  },
  {
    defaultValue: "-",
    description: "Cycle mode. Rotates through this list automatically.",
    name: "words",
  },
  {
    defaultValue: "-",
    description: "Style the rendered text with CSS or utility classes.",
    name: "className",
  },
  {
    defaultValue: "-",
    description: "Control the active word and disable the internal timer.",
    name: "index",
  },
  {
    defaultValue: String(WORD_HOLD_MS),
    description: "Time between automatic transitions, in milliseconds.",
    name: "interval",
  },
  {
    defaultValue: String(DEFAULT_DURATION_MS),
    description: "Incoming character duration, in milliseconds.",
    name: "duration",
  },
  {
    defaultValue: String(DEFAULT_EXIT_DURATION_MS),
    description: "Outgoing character duration, in milliseconds.",
    name: "exitDuration",
  },
  {
    defaultValue: `${DEFAULT_ENTER_ANGLE}°`,
    description: "Incoming travel direction. -90° moves up.",
    name: "enterAngle",
  },
  {
    defaultValue: `${DEFAULT_EXIT_ANGLE}°`,
    description: "Outgoing travel direction. -90° moves up.",
    name: "exitAngle",
  },
  {
    defaultValue: "false",
    description: "Send both directions down unless an angle overrides it.",
    name: "down",
  },
  {
    defaultValue: String(DEFAULT_STAGGER_MS),
    description: "Delay between neighboring characters, in milliseconds.",
    name: "stagger",
  },
  {
    defaultValue: String(DEFAULT_ENTRANCE_HEIGHT),
    description: "Entrance overshoot distance.",
    name: "entranceHeight",
  },
  {
    defaultValue: String(DEFAULT_ENTRANCE_SCALE),
    description: "Peak scale during entrance.",
    name: "entranceScale",
  },
  {
    defaultValue: String(DEFAULT_EXIT_HEIGHT),
    description: "Exit distance as a percentage of line height.",
    name: "exitHeight",
  },
  {
    defaultValue: String(DEFAULT_EXIT_SCALE),
    description: "Final scale for outgoing characters.",
    name: "exitScale",
  },
  { defaultValue: "true", description: "Blur characters as they enter and exit.", name: "blur" },
  {
    defaultValue: "true",
    description: "Scale characters as they enter and exit.",
    name: "scale",
  },
  {
    defaultValue: "true",
    description: "Keep matching leading characters still.",
    name: "preservePrefix",
  },
];

const useFor = [
  "Action labels that move through states: Save, Saving…, Saved.",
  "Prices and counters where only a few digits change.",
  "Status changes such as deploys, uploads, presence, and build steps.",
  "Compact headlines cycling through a few phrases.",
];

const avoidFor = [
  "Paragraphs and long sentences. Gust animates characters, not reading flow.",
  "Telemetry that updates before the current transition can finish.",
  "Editable text or anything someone is actively reading.",
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-10 text-sm font-medium">
      {children}
    </h2>
  );
}

function InstallCommand({
  method,
  onMethodChange,
}: {
  method: InstallMethod;
  onMethodChange: (method: InstallMethod) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);
  const selected = installOptions.find((option) => option.id === method) ?? installOptions[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(selected.command);
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 px-1">
        {installOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={method === option.id}
            onClick={() => {
              onMethodChange(option.id);
              setCopied(false);
            }}
            className={cn(
              "text-xs transition-colors duration-200",
              method === option.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised py-2 pr-2 pl-5">
        <div
          className="-my-3 min-w-0 flex-1 overflow-x-auto py-3"
          data-testid="install-command-viewport"
        >
          <code className="block w-max font-mono text-[11px] leading-5 whitespace-nowrap sm:text-xs">
            <span className="text-muted-foreground select-none">$ </span>
            <Gust
              data-testid="install-command"
              text={selected.command}
              duration={320}
              exitDuration={220}
              stagger={3}
              entranceHeight={4}
              entranceScale={1.04}
              exitHeight={48}
              exitScale={0.72}
            />
          </code>
        </div>
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
  const [installMethod, setInstallMethod] = React.useState<InstallMethod>("package");

  return (
    <SiteShell>
      <main className="flex flex-col gap-14 pt-2 pb-24 lg:pt-10">
        <section id="demos" className="flex scroll-mt-10 flex-col gap-3">
          <HeroPreview />
          <DemoGrid />
        </section>

        <section id="about" className="flex scroll-mt-10 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-sm font-medium">Text that moves like air.</h1>
            <p className="text-sm text-pretty text-muted-foreground">
              Gust animates changing React text one character at a time. Shared prefixes stay put
              while old glyphs lift out and new ones settle in.
            </p>
          </div>
          <InstallCommand method={installMethod} onMethodChange={setInstallMethod} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading id="usage">Usage</SectionHeading>
          <CodeBlock key={installMethod} code={usageSnippets[installMethod]} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading id="how-it-works">How it works</SectionHeading>
          <p className="text-sm text-pretty text-muted-foreground">
            Gust compares strings, keeps shared characters still, then lifts changed glyphs out as
            replacements rise and settle. The Web Animations API drives each glyph.
          </p>
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
          <SectionHeading id="best-practices">When Gust fits</SectionHeading>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">Good for</h3>
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
              <h3 className="text-sm text-muted-foreground">Skip it for</h3>
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

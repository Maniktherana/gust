import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { HeroCarousel } from "@/components/demos";
import { PropReference } from "@/components/reference/props";
import { SiteShell } from "@/components/site-nav";
import { useElementSize } from "@/hooks/use-element";
import { Gust, type GustProps } from "@maniktherana/gust";
import { agentInstallPrompt } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

const packageName = "@maniktherana/gust";

const installOptions = [
  { id: "npm", runner: "npm i", target: packageName },
  { id: "pnpm", runner: "pnpm add", target: packageName },
  { id: "yarn", runner: "yarn add", target: packageName },
  { id: "bun", runner: "bun add", target: packageName },
  {
    id: "shadcn",
    runner: "npx shadcn@latest add",
    target: "https://gust.manikrana.dev/r/gust.json",
  },
  { id: "agent", runner: "", target: "" },
] as const;

type InstallOption = (typeof installOptions)[number];

// Tuned for 14px monospace. The default 4px blur cap is sized for display
// text and smears small glyphs, so it scales down here with the travel.
const commandMotion = {
  duration: 340,
  entranceOvershoot: 6,
  entranceHeight: 60,
  entranceScale: 1.04,
  exitBlur: 1,
  exitDuration: 260,
  exitHeight: 60,
  exitScale: 0.7,
  stagger: 6,
} satisfies Omit<GustProps, "value">;

const heightTransition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const;

const usageSnippet = (
  importPath: string,
  stylesheet: boolean,
) => `import { useEffect, useState } from "react";
import { Gust } from "${importPath}";${stylesheet ? `\nimport "${packageName}/styles.css";` : ""}

const messages = ["Queued", "Building", "Live"];

export function Status() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return <Gust value={messages[index] ?? ""} />;
}`;

function Section({
  children,
  id,
  intro,
  title,
}: {
  children?: React.ReactNode;
  id: string;
  intro?: React.ReactNode;
  title: string;
}) {
  return (
    <section data-intro-after className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h2 id={id} className="scroll-mt-10 text-2xl font-medium tracking-tight">
          {title}
        </h2>
        {intro ? <p className="text-base text-pretty text-muted-foreground">{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Snippet({ children, copy }: { children: React.ReactNode; copy: string }) {
  return (
    <div className="relative rounded-xl bg-surface-raised">
      {children}
      <CopyButton
        value={copy}
        label="Copy"
        showLabel={false}
        variant="ghost"
        size="icon"
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
      />
    </div>
  );
}

// Grows and shrinks with its content instead of jumping between heights.
function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  return (
    <motion.div
      initial={false}
      animate={{ height: size.height || "auto" }}
      transition={heightTransition}
      className="overflow-hidden"
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
}

function Install({
  onSelect,
  selected,
}: {
  onSelect: (option: InstallOption) => void;
  selected: InstallOption;
}) {
  const isAgent = selected.id === "agent";

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Install method" className="flex flex-wrap gap-x-5 gap-y-1">
        {installOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected.id === option.id}
            onClick={() => onSelect(option)}
            className={cn(
              "text-sm transition-colors duration-200",
              selected.id === option.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.id}
          </button>
        ))}
      </div>
      <Snippet copy={isAgent ? agentInstallPrompt : `${selected.runner} ${selected.target}`}>
        <AnimatedHeight>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={isAgent ? "agent" : "command"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isAgent ? (
                <p className="py-4 pr-14 pl-5 font-mono text-code text-pretty text-secondary-foreground">
                  {agentInstallPrompt}
                </p>
              ) : (
                <div className="overflow-x-auto py-4 pr-14 pl-5">
                  <code className="block w-max font-mono text-code whitespace-pre">
                    <Gust
                      value={selected.runner}
                      {...commandMotion}
                      className="text-muted-foreground"
                    />{" "}
                    <Gust value={selected.target} {...commandMotion} />
                  </code>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </AnimatedHeight>
      </Snippet>
    </div>
  );
}

function Home() {
  const [install, setInstall] = React.useState<InstallOption>(installOptions[0]);
  const fromSource = install.id === "shadcn";

  return (
    <SiteShell>
      <main className="flex flex-col gap-20 pt-4 pb-24">
        <HeroCarousel />

        <section data-intro-after className="flex flex-col gap-3">
          <h1 className="text-2xl font-medium tracking-tight">Text that moves like air</h1>
          <p className="text-base text-pretty text-muted-foreground">
            Gust animates changing React text one character at a time. Shared prefixes stay put
            while old glyphs lift out and new ones settle in, and the width eases to fit. It runs on
            the Web Animations API, with no animation library.
          </p>
        </section>

        <Section id="install" title="Install">
          <Install selected={install} onSelect={setInstall} />
        </Section>

        <Section
          id="usage"
          title="Usage"
          intro="Your component owns the value and decides when it changes. Gust animates from the previous string to the next one."
        >
          <CodeBlock
            code={
              fromSource
                ? usageSnippet("@/components/ui/gust", false)
                : usageSnippet(packageName, true)
            }
          />
          <p className="text-base text-pretty text-muted-foreground">
            {fromSource
              ? "The shadcn CLI copies the source into components/ui/gust and adds its styles to your global CSS."
              : "Import the stylesheet once. It holds Gust's structural layout and nothing else."}
          </p>
        </Section>

        <Section
          id="props"
          title="Props"
          intro="The defaults suit display text. Each panel runs the real component, and its graph is drawn from the same keyframes Gust plays."
        >
          <PropReference />
        </Section>
      </main>
    </SiteShell>
  );
}

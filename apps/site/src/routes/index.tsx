import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Gust } from "@maniktherana/gust";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { DemoGrid } from "@/components/demos";
import { SiteShell } from "@/components/site-nav";
import { agentInstallPrompt } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const packageName = "@maniktherana/gust";
const installOptions = [
  { id: "bun", runner: "bun add @maniktherana/gust"},
  {
    id: "shadcn",
    runner: "bunx --bun shadcn@latest add https://gust.manikrana.dev/r/gust.json",
  },
] as const;

type InstallOption = (typeof installOptions)[number];

const usageSnippet = (
  source: boolean,
) => `import { Gust } from "${source ? "@/components/ui/gust" : packageName}";${source ? "" : `\nimport "${packageName}/styles.css";`}

<Gust value={text} />`;

function Section({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="scroll-mt-10 text-sm font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InstallCommand({ selected }: { selected: InstallOption }) {
  const motion = {
  entranceOvershoot: 30,
	entranceScale: 1,
	exitDuration: 150,
	exitHeight: 150,
     stagger: 10,
     preservePrefix: true,
	exitBlur: 2,
	entranceBlur: 1,
	entranceHeight: 250,
	entranceOffset: 1,
	entranceDuration: 250,
	exitScale: 10,
  };

  return (
    <div className="relative rounded-xl bg-surface-raised">
      <div className="overflow-x-auto rounded-[inherit]">
        <code className="block w-max min-w-full py-4 pr-14 pl-5 font-mono text-code whitespace-pre">
          <Gust value={selected.runner} {...motion} className="text-foreground" />{" "}
        </code>
      </div>
      <CopyButton
        value={`${selected.runner}`}
        label="Copy command"
        showLabel={false}
        variant="ghost"
        size="icon"
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
      />
    </div>
  );
}

function Install({
  onSelect,
  selected,
}: {
  onSelect: (option: InstallOption) => void;
  selected: InstallOption;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="-mt-2 flex items-center justify-between gap-3">
        <div role="group" aria-label="Install method" className="flex gap-4">
          {installOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected.id === option.id}
              onClick={() => onSelect(option)}
              className={cn(
                "h-10 rounded-sm text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                selected.id === option.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.id}
            </button>
          ))}
        </div>
        <CopyButton
          value={agentInstallPrompt}
          label="Copy prompt"
          animateLabel={false}
          variant="ghost"
          size="sm"
          className="-mr-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
        />
      </div>
      <InstallCommand selected={selected} />
    </div>
  );
}

function Home() {
  const [install, setInstall] = useState<InstallOption>(installOptions[0]);
  return (
    <SiteShell>
      <main className="flex flex-col gap-10 pt-1">
        <div className="flex flex-col gap-6">
          <h1 className="text-base text-muted-foreground">Text transitions for React.</h1>
          <DemoGrid />
        </div>
        <Section id="install" title="Install">
          <Install selected={install} onSelect={setInstall} />
        </Section>
        <Section id="usage" title="Usage">
          <CodeBlock code={usageSnippet(install.id === "shadcn")} />
        </Section>
      </main>
    </SiteShell>
  );
}

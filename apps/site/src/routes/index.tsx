import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { DemoGrid } from "@/components/demos";
import { SiteShell } from "@/components/site-nav";
import { agentInstallPrompt } from "@/lib/prompts";
import { getUsageSource } from "@/lib/usage-source";

export const Route = createFileRoute("/")({
  loader: () => getUsageSource(),
  component: Home,
});

const installCommand = "npm install @maniktherana/gust";

function Section({
  children,
  id,
  title,
  actions,
}: {
  children: ReactNode;
  id: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2
          id={id}
          className="flex h-9 items-center scroll-mt-10 text-base leading-5 font-semibold"
        >
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function InstallCommand() {
  return (
    <div className="relative rounded-xl bg-surface-raised">
      <div className="overflow-x-auto rounded-[inherit]">
        <code className="block w-max min-w-full py-4 pr-14 pl-5 font-mono text-code whitespace-pre">
          {installCommand}
        </code>
      </div>
      <CopyButton
        value={installCommand}
        label="Copy command"
        showLabel={false}
        variant="ghost"
        size="icon"
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
      />
    </div>
  );
}

function Home() {
  const source = Route.useLoaderData();

  return (
    <SiteShell>
      <main className="flex flex-col gap-8 pt-1">
        <div className="flex flex-col gap-6">
          <h1 className="text-base text-muted-foreground">Text transitions for React.</h1>
          <DemoGrid />
        </div>
        <Section
          id="install"
          title="Install"
          actions={
            <CopyButton
              value={agentInstallPrompt}
              label="Copy prompt"
              animateLabel={false}
              variant="ghost"
              size="default"
              className="-mr-2 text-sm leading-5 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
            />
          }
        >
          <InstallCommand />
        </Section>
        <Section id="usage" title="Usage">
          <CodeBlock code={source.code} html={source.html} />
        </Section>
      </main>
    </SiteShell>
  );
}

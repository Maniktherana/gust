import { createFileRoute } from "@tanstack/react-router";

import { CopyButton } from "@/components/copy-button";
import { SiteShell } from "@/components/site-nav";
// The same file is served raw at /gust.md, so agents can fetch it without JS.
import guide from "../../public/gust.md?raw";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "Gust: Agent guide" },
      {
        name: "description",
        content:
          "Gust's guide for coding agents: install, usage, every prop with its default, recipes and common mistakes.",
      },
    ],
  }),
  component: AgentGuide,
});

function AgentGuide() {
  return (
    <SiteShell width="document">
      <main className="flex flex-col pt-4 pb-24">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <a
            href="/gust.md"
            className="font-mono text-caption text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            gust.md
          </a>
          <CopyButton
            value={guide}
            label="Copy guide"
            showLabel={false}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        <pre className="pt-6 font-mono text-code break-words whitespace-pre-wrap text-secondary-foreground">
          {guide}
        </pre>
      </main>
    </SiteShell>
  );
}

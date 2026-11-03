import { createFileRoute } from "@tanstack/react-router";
import { DemoBox, demos, HeadlineBox, headlinePrompt } from "@/components/demos";
import { DemoCopyButton } from "@/components/demo-copy-button";
import { examples } from "@/components/examples";
import { ExampleCard } from "@/components/examples/example-card";
import { SiteShell } from "@/components/site-nav";

export const Route = createFileRoute("/examples")({
  head: () => ({ meta: [{ title: "Examples · Gust" }] }),
  component: Examples,
});

function Examples() {
  return (
    <SiteShell>
      <main className="flex flex-col gap-6 pt-1">
        <h1 className="text-lg font-medium">Examples</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {examples.map((example) => (
            <ExampleCard key={example.id} example={example}>
              <DemoCopyButton prompt={example.prompt} title={example.title} />
            </ExampleCard>
          ))}
          <HeadlineBox className="h-72 sm:h-72">
            <DemoCopyButton prompt={headlinePrompt} title="Headline" />
          </HeadlineBox>
          {demos.map((demo) => (
            <DemoBox key={demo.id} demo={demo} className="h-72">
              <DemoCopyButton prompt={demo.prompt} title={demo.title} />
            </DemoBox>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}

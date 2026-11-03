import { createFileRoute } from "@tanstack/react-router";
import { DemoBox, demos } from "@/components/demos";
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
            <ExampleCard key={example.id} example={example} />
          ))}
          {demos
            .filter((demo) => demo.id === "otp")
            .map((demo) => (
              <DemoBox key={demo.id} demo={demo} className="sm:col-span-2" />
            ))}
        </div>
      </main>
    </SiteShell>
  );
}

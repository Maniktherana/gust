import { createFileRoute } from "@tanstack/react-router";
import { TextPlayground } from "@/components/text-playground";
import { SiteShell } from "@/components/site-nav";

export const Route = createFileRoute("/lab")({
  head: () => ({ meta: [{ title: "Lab · Gust" }] }),
  component: Lab,
});

function Lab() {
  return (
    <SiteShell>
      <main className="flex min-w-0 flex-col gap-6 pt-1">
        <h1 className="text-lg font-medium">Lab</h1>
        <TextPlayground />
      </main>
    </SiteShell>
  );
}

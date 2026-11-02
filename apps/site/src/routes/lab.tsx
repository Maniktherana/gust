import { createFileRoute } from "@tanstack/react-router";
import { PropReference } from "@/components/reference/props";
import { SiteShell } from "@/components/site-nav";

export const Route = createFileRoute("/lab")({
  head: () => ({ meta: [{ title: "Lab · Gust" }] }),
  component: Lab,
});

function Lab() {
  return (
    <SiteShell>
      <main className="flex flex-col gap-8 pt-4">
        <h1 className="text-lg font-medium">Lab</h1>
        <PropReference />
      </main>
    </SiteShell>
  );
}

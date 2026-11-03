import { createFileRoute } from "@tanstack/react-router";
import { MotionLab } from "@/components/reference/motion-lab";
import { SiteShell } from "@/components/site-nav";

export const Route = createFileRoute("/engine")({
  head: () => ({ meta: [{ title: "Engine · Gust" }] }),
  component: Engine,
});

function Engine() {
  return (
    <SiteShell>
      <main className="flex flex-col gap-6 pt-1">
        <h1 className="text-lg font-medium">Engine</h1>
        <MotionLab />
      </main>
    </SiteShell>
  );
}

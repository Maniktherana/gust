import { createFileRoute } from "@tanstack/react-router";
import { MotionLab } from "@/components/reference/motion-lab";
import { SiteShell } from "@/components/site-nav";

export const Route = createFileRoute("/engine")({
  head: () => ({ meta: [{ title: "Engine · Gust" }] }),
  component: Engine,
});

function Engine() {
  return (
    <SiteShell className="h-dvh min-h-0 pb-4" footer={null}>
      <main className="flex min-h-0 flex-1 flex-col gap-6 pt-1">
        <h1 className="text-lg font-medium">Engine</h1>
        <MotionLab />
      </main>
    </SiteShell>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep old links working after the gallery moved onto the landing page.
export const Route = createFileRoute("/examples")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

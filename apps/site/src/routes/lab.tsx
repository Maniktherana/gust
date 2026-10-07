import { createFileRoute, redirect } from "@tanstack/react-router";

// The demos and interactive prop reference now live on the landing page.
export const Route = createFileRoute("/lab")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

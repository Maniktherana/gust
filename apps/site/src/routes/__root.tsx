import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";

import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Gust: React text transitions",
      },
      {
        name: "description",
        content:
          "Animate changing React text one character at a time. No animation library, and shared prefixes stay still.",
      },
      {
        property: "og:title",
        content: "Gust",
      },
      {
        property: "og:description",
        content: "Animate changing React text one character at a time. Text that moves like air.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://gust.manikrana.dev",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/icon.svg",
      },
      {
        rel: "canonical",
        href: "https://gust.manikrana.dev",
      },
      {
        rel: "alternate",
        type: "text/markdown",
        href: "/gust.md",
        title: "Gust agent guide",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="relative isolate min-h-dvh overflow-x-clip">
          <Outlet />
        </div>
        <DialRoot position="bottom-right" theme="dark" />
        <Scripts />
      </body>
    </html>
  );
}

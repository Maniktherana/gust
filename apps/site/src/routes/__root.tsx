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
        content: "Text transitions for React.",
      },
      {
        property: "og:title",
        content: "Gust",
      },
      {
        property: "og:description",
        content: "Text transitions for React.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://gust.manikrana.dev",
      },
      {
        property: "og:site_name",
        content: "gust",
      },
      {
        property: "og:image",
        content: "https://gust.manikrana.dev/og.png",
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:alt",
        content: "gust icon above npm i @maniktherana/gust, with the word gust lifting away",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      { name: "theme-color", content: "#0f0f0f" },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/open-runde/OpenRunde-Regular-Tabular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/open-runde/OpenRunde-Medium-Tabular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/open-runde/OpenRunde-Semibold-Tabular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/jetbrains-mono/jetbrains-mono-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "48x48",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/icon.svg",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
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
      <body
        onPointerDownCapture={() => {
          document.documentElement.dataset.focusInput = "pointer";
        }}
        onKeyDownCapture={(event) => {
          if (event.key === "Tab") document.documentElement.dataset.focusInput = "keyboard";
        }}
      >
        <div className="relative isolate min-h-dvh overflow-x-clip">
          <Outlet />
        </div>
        <DialRoot position="bottom-right" theme="dark" />
        <Scripts />
      </body>
    </html>
  );
}

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";

import appCss from "@/styles/globals.css?url";

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("gust-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || "system";
    document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && systemDark));
  } catch (_) {}
})();
`;

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
          "Animate changing React text one character at a time. No animation runtime, stable shared prefixes, and built-in reduced-motion support.",
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
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <div className="relative isolate min-h-dvh overflow-x-clip">
            <Outlet />
          </div>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

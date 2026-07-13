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
        title: "Gust — text that moves like air",
      },
      {
        name: "description",
        content:
          "Gust is a zero-added-dependency React text animation. Characters lift out and settle in on a draft of air — staggered, prefix-aware, reduced-motion safe.",
      },
      {
        property: "og:title",
        content: "Gust",
      },
      {
        property: "og:description",
        content: "A zero-added-dependency React text animation. Text that moves like air.",
      },
      {
        property: "og:type",
        content: "website",
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

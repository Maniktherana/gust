import { Link } from "@tanstack/react-router";

import { IconGithub } from "@/components/icons";
import { cn } from "@/lib/utils";

const navLinkClassName =
  "grid h-11 place-items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground [&.active]:text-foreground";

function TopNav() {
  return (
    <header
      data-intro-after
      className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-6"
    >
      <nav aria-label="Main navigation" className="flex items-center">
        <Link to="/" activeOptions={{ exact: true }} className={navLinkClassName}>
          Home
        </Link>
        <Link to="/agent" className={navLinkClassName}>
          Agent
        </Link>
      </nav>
      <a
        href="https://github.com/Maniktherana/gust"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <IconGithub size="16px" />
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer
      data-intro-after
      className="flex items-center justify-between border-t border-border py-8 text-sm text-muted-foreground"
    >
      <span>MIT licensed</span>
      <span>
        By{" "}
        <a
          href="https://manikrana.dev"
          target="_blank"
          rel="noreferrer"
          className="text-foreground"
        >
          Manik
        </a>
      </span>
    </footer>
  );
}

const shellWidths = {
  default: "max-w-2xl md:px-0",
  document: "max-w-4xl",
  wide: "max-w-5xl",
};

export function SiteShell({
  children,
  width = "default",
}: {
  children: React.ReactNode;
  width?: keyof typeof shellWidths;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <div className={cn("mx-auto flex w-full flex-1 flex-col px-6", shellWidths[width])}>
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </div>
  );
}

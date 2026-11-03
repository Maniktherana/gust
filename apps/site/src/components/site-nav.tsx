import { Link } from "@tanstack/react-router";
import { IconGithub } from "@/components/icons";

function TopNav() {
  return (
    <header className="flex h-11 shrink-0 items-center">
      <Link
        to="/"
        className="-ml-2 grid h-11 place-items-center rounded-md px-2 text-2xl font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Gust
      </Link>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-8 grid grid-cols-1 justify-items-center pb-6 text-sm font-semibold text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-1 sm:pb-10">
      <nav
        aria-label="Main navigation"
        className="flex max-w-full flex-wrap items-center justify-center gap-1 sm:col-start-2 sm:row-start-1"
      >
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          Home
        </Link>
        <Link
          to="/examples"
          className="grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          Examples
        </Link>
        <Link
          to="/lab"
          className="grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          Lab
        </Link>
        <Link
          to="/engine"
          className="grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          Engine
        </Link>
      </nav>
      <div className="flex items-center gap-4 sm:col-start-1 sm:row-start-1 sm:justify-self-start">
        <a
          href="https://manikrana.dev"
          target="_blank"
          rel="noreferrer"
          className="grid h-11 place-items-center rounded-md text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          Manik Rana
        </a>
        <a
          href="https://github.com/Maniktherana/gust"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="relative grid h-11 w-4 place-items-center rounded-md text-sm text-muted-foreground outline-none transition-colors duration-150 before:absolute before:inset-y-0 before:-inset-x-3.5 before:content-[''] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground"
        >
          <IconGithub size="16px" />
        </a>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-[calc(100%-40px)] max-w-reading flex-col pt-6 sm:pt-10">
      <TopNav />
      {children}
      <Footer />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { IconGithub } from "@/components/icons";

const navLinkClassName =
  "grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground";

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
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-6 text-sm font-semibold text-muted-foreground sm:pb-10">
      <a
        href="https://manikrana.dev"
        target="_blank"
        rel="noreferrer"
        className={`${navLinkClassName} -ml-2`}
      >
        Manik Rana
      </a>
      <nav aria-label="Main navigation" className="-mr-2 flex items-center gap-1">
        <Link to="/" activeOptions={{ exact: true }} className={navLinkClassName}>
          Home
        </Link>
        <Link to="/examples" className={navLinkClassName}>
          Examples
        </Link>
        <Link to="/lab" className={navLinkClassName}>
          Lab
        </Link>
        <a
          href="https://github.com/Maniktherana/gust"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className={`${navLinkClassName} w-11`}
        >
          <IconGithub size="16px" />
        </a>
      </nav>
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

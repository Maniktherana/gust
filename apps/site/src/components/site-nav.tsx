import { Link } from "@tanstack/react-router";
import { IconGithub } from "@/components/icons";

const navLinkClassName =
  "grid h-11 place-items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [&.active]:text-foreground";

function TopNav() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4">
      <Link
        to="/"
        className="-ml-2 grid h-11 place-items-center rounded-md px-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Gust
      </Link>
      <nav aria-label="Main navigation" className="-mr-2 flex items-center gap-1">
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
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 flex items-center justify-between border-t border-separator py-8 text-sm text-muted-foreground">
      <span>MIT licensed</span>
      <a
        href="https://manikrana.dev"
        target="_blank"
        rel="noreferrer"
        className="rounded-sm underline decoration-foreground/30 underline-offset-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Manik Rana
      </a>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-[calc(100%-40px)] max-w-reading flex-col pt-6 sm:pt-10">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

import { Link } from "@tanstack/react-router";

import { IconGithub } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

const sectionLinks = [
  { href: "/#about", label: "About" },
  { href: "/#usage", label: "Usage" },
  { href: "/#props", label: "Props" },
  { href: "/#best-practices", label: "Best practices" },
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-44 flex-col justify-between px-8 py-10 lg:flex">
      <div className="flex flex-col gap-8">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          gust
        </Link>
        <nav className="flex flex-col gap-2">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/lab"
            className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground [&.active]:text-foreground"
          >
            Lab
          </Link>
        </nav>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">v0.1 · MIT</p>
        <p className="text-xs text-muted-foreground">
          made by{" "}
          <a
            href="https://manikrana.dev"
            target="_blank"
            rel="noreferrer"
            className="text-foreground"
          >
            Manik
          </a>
        </p>
        <div className="-ml-2 flex items-center">
          <a
            href="https://github.com/maniktherana/manikrana.dev"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid size-8 place-items-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <IconGithub size="16px" />
          </a>
          <ThemeToggle className="size-8" />
        </div>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="flex items-center justify-between py-6 lg:hidden">
      <Link to="/" className="text-sm font-semibold tracking-tight">
        gust
      </Link>
      <div className="flex items-center gap-1">
        <Link
          to="/lab"
          className="grid h-10 place-items-center px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground [&.active]:text-foreground"
        >
          Lab
        </Link>
        <a
          href="https://github.com/maniktherana/manikrana.dev"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="grid size-10 place-items-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <IconGithub size="16px" />
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="mx-auto flex w-full max-w-xl flex-col px-6 lg:px-0">
        <MobileHeader />
        {children}
      </div>
    </>
  );
}

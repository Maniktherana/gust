import { MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "relative grid size-10 place-items-center rounded-lg text-muted-foreground transition-[color,scale] duration-200 hover:text-foreground active:scale-[0.96]",
        className,
      )}
    >
      <SunIcon
        aria-hidden="true"
        className="col-start-1 row-start-1 size-4 scale-100 opacity-100 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-25 dark:opacity-0 dark:blur-[4px]"
      />
      <MoonIcon
        aria-hidden="true"
        className="col-start-1 row-start-1 size-4 scale-25 opacity-0 blur-[4px] transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] dark:scale-100 dark:opacity-100 dark:blur-none"
      />
    </button>
  );
}

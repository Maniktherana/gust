import * as React from "react";
import { codeToHtml } from "shiki";

import { IconBadgeCheck, IconCloneFilled } from "@/components/icons";
import { cn } from "@/lib/utils";

const blockClassName =
  "overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-xs leading-relaxed";

export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const [html, setHtml] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    codeToHtml(code, {
      lang,
      themes: { dark: "vesper", light: "min-light" },
    }).then((highlighted) => {
      if (!cancelled) setHtml(highlighted);
    });

    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  React.useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }

    setCopied(true);

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code"}
        onClick={copy}
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg text-muted-foreground transition-[color,scale] duration-200 hover:text-foreground active:scale-[0.96]"
      >
        <span className="grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-4">
          <IconCloneFilled
            className={cn(
              "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              copied ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
            )}
          />
          <IconBadgeCheck
            className={cn(
              "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              copied ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-[4px]",
            )}
          />
        </span>
      </button>
      {html ? (
        // oxlint-disable-next-line react/no-danger -- shiki output generated from our own static snippet
        <div className={blockClassName} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className={cn(blockClassName, "text-secondary-foreground")}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

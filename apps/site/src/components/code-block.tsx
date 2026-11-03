import * as React from "react";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { highlightCode } from "@/lib/highlight-code";

export function CodeBlock({
  code,
  html: highlightedHtml,
  lang = "tsx",
  variant = "default",
}: {
  code: string;
  html?: string;
  lang?: string;
  variant?: "bare" | "default";
}) {
  const [clientHtml, setHtml] = React.useState<string | null>(null);
  const html = highlightedHtml ?? clientHtml;

  React.useEffect(() => {
    if (highlightedHtml !== undefined) return;
    let cancelled = false;

    highlightCode(code, lang).then((highlighted) => {
      if (!cancelled) setHtml(highlighted);
    });

    return () => {
      cancelled = true;
    };
  }, [code, lang, highlightedHtml]);

  return (
    <div className="group/code relative">
      <CopyButton
        value={code}
        label="Copy code"
        showLabel={false}
        variant="ghost"
        size="icon"
        className={cn(
          "absolute text-muted-foreground hover:bg-transparent hover:text-foreground",
          variant === "bare"
            ? "-top-1.5 right-0 opacity-0 transition-opacity duration-150 group-hover/code:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
            : "top-2.5 right-2.5",
        )}
      />
      {html ? (
        // oxlint-disable-next-line react/no-danger -- shiki output generated from our own static snippet
        <div
          className={cn(
            "code-block overflow-x-auto",
            variant === "default" && "rounded-xl bg-surface-raised px-5 py-4",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className={cn(
            "code-block overflow-x-auto",
            variant === "default" && "rounded-xl bg-surface-raised px-5 py-4",
            "text-secondary-foreground",
          )}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

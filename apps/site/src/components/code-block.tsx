import * as React from "react";
import { codeToHtml } from "shiki";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const variantClassNames = {
  bare: "",
  default: "rounded-xl bg-surface-raised px-5 py-4",
};

export function CodeBlock({
  code,
  lang = "tsx",
  variant = "default",
}: {
  code: string;
  lang?: string;
  variant?: keyof typeof variantClassNames;
}) {
  const [html, setHtml] = React.useState<string | null>(null);
  const blockClassName = cn("overflow-x-auto font-mono text-code", variantClassNames[variant]);

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
        <div className={blockClassName} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className={cn(blockClassName, "text-secondary-foreground")}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

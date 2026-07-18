import * as React from "react";
import { codeToHtml } from "shiki";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const blockClassName =
  "overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-xs leading-relaxed";

export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  const [html, setHtml] = React.useState<string | null>(null);

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
    <div className="relative">
      <CopyButton
        value={code}
        label="Copy code"
        showLabel={false}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
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

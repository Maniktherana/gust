import * as React from "react";

import { IconBadgeCheck, IconCloneFilled } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gust, type GustProps } from "@maniktherana/gust";

type CopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "value"
> & {
  copiedLabel?: string;
  gustProps?: Omit<GustProps, "value">;
  label?: string;
  resetAfter?: number;
  showLabel?: boolean;
  value: string | (() => string);
};

const glyphTransition =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

export function CopyButton({
  className,
  copiedLabel = "Copied",
  gustProps,
  label = "Copy",
  resetAfter = 2000,
  showLabel = true,
  value,
  ...buttonProps
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);

  const copy = async () => {
    const text = typeof value === "function" ? value() : value;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    setCopied(true);

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, resetAfter);
  };

  return (
    <Button
      {...buttonProps}
      type="button"
      aria-label={copied ? copiedLabel : label}
      className={className}
      onClick={copy}
    >
      <span
        data-icon={showLabel ? "inline-start" : undefined}
        className="grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1"
      >
        <IconCloneFilled
          className={cn(
            glyphTransition,
            copied ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
          )}
        />
        <IconBadgeCheck
          className={cn(
            glyphTransition,
            copied ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-[4px]",
          )}
        />
      </span>
      {showLabel ? <Gust {...gustProps} value={copied ? copiedLabel : label} /> : null}
    </Button>
  );
}

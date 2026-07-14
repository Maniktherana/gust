import * as React from "react";

import { IconBadgeCheck, IconCloneFilled } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gust } from "@maniktherana/gust";

const glyphVisible = "scale-100 opacity-100 blur-none";
const glyphHidden = "scale-25 opacity-0 blur-[4px]";
const glyphTransition =
  "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";

export function CopyDemo() {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | null>(null);

  const copy = () => {
    setCopied(true);

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      setCopied(false);
    }, 1800);
  };

  React.useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <Button variant="outline" onClick={copy}>
      <span className="grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1">
        <IconCloneFilled className={cn(glyphTransition, copied ? glyphHidden : glyphVisible)} />
        <IconBadgeCheck className={cn(glyphTransition, copied ? glyphVisible : glyphHidden)} />
      </span>
      <Gust text={copied ? "Copied" : "Copy"} />
    </Button>
  );
}

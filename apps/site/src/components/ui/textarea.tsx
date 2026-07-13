import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content min-h-16 w-full resize-y rounded-lg border border-input bg-[var(--field)] px-2 py-2 font-sans text-sm leading-relaxed font-normal shadow-[var(--shadow-control)] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[var(--shadow-control-focus)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60 aria-invalid:border-destructive aria-invalid:shadow-[var(--shadow-control)] aria-invalid:ring-0 aria-invalid:focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--destructive)_36%,transparent),var(--shadow-control)]",
);

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(textareaVariants(), className)} {...props} />;
}

export { Textarea, textareaVariants };

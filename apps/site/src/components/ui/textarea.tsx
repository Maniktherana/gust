import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex field-sizing-content min-h-16 w-full resize-y rounded-lg border border-input bg-[var(--field)] bg-clip-border px-2 py-2 font-sans text-sm leading-relaxed font-normal shadow-[var(--shadow-control)] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:shadow-[var(--shadow-control)] aria-invalid:ring-0 aria-invalid:focus-visible:shadow-none",
);

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <span
      data-slot="textarea"
      className="relative block w-full rounded-lg before:pointer-events-none before:absolute before:inset-0 before:rounded-lg-inner before:shadow-[var(--shadow-highlight)] before:content-[''] has-[:focus-visible]:before:shadow-none has-[:disabled]:opacity-60"
    >
      <textarea
        data-slot="textarea-control"
        className={cn(textareaVariants(), className)}
        {...props}
      />
    </span>
  );
}

export { Textarea, textareaVariants };

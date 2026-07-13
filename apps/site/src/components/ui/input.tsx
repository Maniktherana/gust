import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  cn(
    "relative inline-flex h-8 min-h-[var(--control-height)] w-full min-w-0 rounded-lg border border-input bg-clip-border font-sans text-sm leading-none font-normal outline-none transition-colors",
    // surface + elevation
    "bg-[var(--field)] shadow-[var(--shadow-control)]",
    // overlay sheen
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-lg-inner before:shadow-[var(--shadow-highlight)] before:content-['']",
    // focus ring (keyboard / text-entry focus only)
    "has-[:focus-visible]:border-ring has-[:focus-visible]:shadow-none has-[:focus-visible]:before:shadow-none",
    // disabled
    "has-[:disabled]:opacity-60",
    // invalid
    "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:shadow-[var(--shadow-control)]",
    "has-[[aria-invalid=true]]:has-[:focus-visible]:shadow-none",
  ),
  {
    variants: {
      controlSize: {
        default: "",
        sm: "h-7! min-h-7!",
      },
      radius: {
        squared: "",
        rounded: "rounded-full!",
      },
    },
    defaultVariants: {
      controlSize: "default",
      radius: "squared",
    },
  },
);

function Input({
  className,
  controlSize = "default",
  radius = "squared",
  type,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <span
      data-slot="input"
      data-size={controlSize}
      data-radius={radius}
      className={cn(inputVariants({ controlSize, radius }), className)}
    >
      <InputPrimitive
        type={type}
        data-slot="input-control"
        className="h-full w-full min-w-0 rounded-[inherit] bg-transparent px-2 py-0 outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-muted-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground"
        {...props}
      />
    </span>
  );
}

export { Input, inputVariants };

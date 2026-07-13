"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
};

function Switch({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  nativeButton,
  render,
  size = "default",
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Root always receives an aria-label or aria-labelledby just below
      render={render ?? <button type="button" />}
      nativeButton={nativeButton ?? true}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? "Toggle")}
      aria-labelledby={ariaLabelledBy}
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex h-5 shrink-0 items-center rounded-full border border-transparent outline-none transition-[box-shadow,opacity] duration-100 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        size === "sm" ? "w-7" : "w-8",
        "focus-visible:[&_[data-slot=switch-track]]:shadow-[0_0_0_1px_var(--ring),var(--shadow-switch-track)]",
        "aria-invalid:[&_[data-slot=switch-track]]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--destructive)_35%,transparent),var(--shadow-switch-track)]",
        "data-checked:[&_[data-slot=switch-track]]:bg-[var(--switch-checked-bg)] data-unchecked:[&_[data-slot=switch-track]]:bg-input",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="switch-track"
        className={cn(
          "pointer-events-none absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden rounded-full bg-input shadow-[var(--shadow-switch-track)] transition-colors duration-75 ease-out",
          size === "sm" ? "h-4" : "h-[18px]",
        )}
      />
      <SwitchPrimitive.Thumb
        aria-hidden="true"
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none relative z-10 block rounded-full bg-white shadow-[var(--shadow-switch-thumb)] transition-transform duration-100 ease-out ring-0 dark:data-unchecked:bg-foreground",
          size === "sm"
            ? "size-3 data-checked:translate-x-[13px] data-unchecked:translate-x-[3px]"
            : "size-3.5 data-checked:translate-x-[14px] data-unchecked:translate-x-[3px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

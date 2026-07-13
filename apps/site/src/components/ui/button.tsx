import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button relative inline-flex min-h-0 shrink-0 origin-center items-center justify-center rounded-lg border border-transparent bg-clip-padding font-sans text-sm leading-none font-medium tracking-normal whitespace-nowrap transition-[background-color,box-shadow,color,scale] duration-100 ease-out outline-none select-none transform-gpu [backface-visibility:hidden] active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:ring-[3px] focus-visible:ring-ring/24 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:shadow-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:shadow-none aria-disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:shadow-none data-[disabled]:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 in-data-[slot=input-group]:shadow-none [&>:not(svg)]:leading-[inherit] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary)] bg-clip-border text-[var(--button-primary-foreground)] shadow-[var(--shadow-button-primary)] hover:bg-[var(--button-primary-pressed)] hover:text-[var(--button-primary-foreground)]",
        secondary:
          "border-transparent bg-[var(--button-secondary)] bg-clip-border text-[var(--button-secondary-foreground)] shadow-[var(--shadow-card)] hover:bg-[var(--button-secondary-hover)] hover:text-[var(--button-secondary-foreground)] active:bg-[var(--button-secondary-hover)] data-[active=true]:bg-[var(--button-secondary-hover)] aria-expanded:bg-[var(--button-secondary-hover)] data-popup-open:bg-[var(--button-secondary-hover)]",
        outline:
          "border-input bg-[var(--button-outline-fill)] bg-clip-border text-foreground shadow-[var(--shadow-control)] before:pointer-events-none before:absolute before:inset-0 before:rounded-lg-inner before:shadow-[var(--shadow-highlight)] before:content-[''] hover:bg-[var(--button-outline-fill-hover)] hover:text-foreground hover:shadow-[var(--shadow-control-hover)] hover:before:shadow-[var(--shadow-highlight)] focus-visible:border-ring focus-visible:shadow-none focus-visible:before:shadow-none active:bg-[var(--button-outline-fill-hover)] data-[active=true]:bg-[var(--button-outline-fill-hover)] aria-expanded:bg-[var(--button-outline-fill-hover)] aria-expanded:text-foreground data-popup-open:bg-[var(--button-outline-fill-hover)] data-popup-open:text-foreground",
        ghost:
          "text-foreground shadow-none hover:bg-black/10 hover:dark:bg-white/10 hover:text-foreground active:bg-black/10 active:dark:bg-white/10",
        destructive:
          "border-transparent bg-[var(--destructive-action)] bg-clip-border text-[var(--destructive-action-foreground)] shadow-[var(--shadow-destructive-action)] hover:bg-[var(--destructive-action-hover)] hover:text-[var(--destructive-action-foreground)]",
        link: "h-auto min-h-0 gap-0 self-center border-transparent bg-transparent p-0 leading-relaxed text-foreground shadow-none no-underline hover:bg-transparent hover:text-foreground hover:underline active:scale-100",
      },
      size: {
        default:
          "h-8 min-h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3",
        sm: "h-7 gap-1 px-2.5 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  static: isStatic = false,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    static?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-static={isStatic || undefined}
      className={cn(buttonVariants({ variant, size, className }), isStatic && "active:scale-100")}
      {...props}
    />
  );
}

export { Button, buttonVariants };

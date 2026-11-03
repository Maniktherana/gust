import { useId } from "react";
import { cn } from "@/lib/utils";
import { ScrollFade } from "./scroll-fade";

type InlineOptionsProps = {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function InlineOptions({
  label,
  value,
  options,
  onValueChange,
  disabled,
  className,
}: InlineOptionsProps) {
  const name = useId();
  return (
    <ScrollFade className="w-full">
      <fieldset
        aria-label={label}
        disabled={disabled}
        className={cn(
          "flex w-max min-w-full flex-nowrap items-center justify-end gap-x-4 border-0 px-1 py-0 text-base font-normal disabled:opacity-50",
          className,
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="relative inline-flex min-h-9 shrink-0 cursor-pointer items-center whitespace-nowrap has-disabled:cursor-default"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0"
            />
            <span className="pointer-events-none rounded-sm text-muted-foreground peer-checked:text-foreground peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/24 peer-hover:text-foreground">
              {option.label}
            </span>
          </label>
        ))}
      </fieldset>
    </ScrollFade>
  );
}

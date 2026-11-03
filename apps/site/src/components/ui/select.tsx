"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
};

function SelectField({
  label,
  value,
  onValueChange,
  options,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      items={options}
      disabled={disabled}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "flex h-9 w-fit min-w-0 max-w-full items-center justify-between justify-self-end gap-2 rounded-lg bg-field px-2.5 text-sm text-foreground shadow-[var(--shadow-control)] outline-none hover:bg-[var(--field-hover)] focus-visible:ring-[3px] focus-visible:ring-ring/24 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <Select.Value className="truncate" />
        <Select.Icon>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={4} align="end" alignItemWithTrigger={false} className="z-50">
          <Select.Popup className="max-h-[var(--available-height)] w-max min-w-36 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-[var(--shadow-surface)] outline-none">
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-highlighted:bg-field"
                >
                  <Select.ItemText className="flex-1">{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="flex size-4 items-center justify-center">
                    <Check aria-hidden="true" className="size-3.5" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export { SelectField, type SelectFieldProps };

import * as React from "react";

import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// A group of related props, such as everything that shapes the exit.
export function PropSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="flex flex-col">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        <p className="text-base text-pretty text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// One prop: its docs and a live snippet on the left, a panel to try it on the
// right (stacked on narrow screens).
export function PropRow({
  children,
  defaultValue,
  description,
  name,
  snippet,
  type,
}: {
  children: React.ReactNode;
  defaultValue: string;
  description: React.ReactNode;
  name: string;
  snippet: string;
  type: string;
}) {
  return (
    <article
      id={name}
      className="grid scroll-mt-10 gap-8 border-b border-border py-10 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-mono text-base">{name}</h4>
            <span className="rounded-md bg-surface-raised px-2 py-0.5 font-mono text-caption text-muted-foreground">
              {type}
            </span>
          </div>
          <p className="text-base text-pretty text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground">
            Default <code className="font-mono text-code text-foreground">{defaultValue}</code>
          </p>
        </div>
        <CodeBlock code={snippet} variant="bare" />
      </div>
      <div className="min-w-0">{children}</div>
    </article>
  );
}

// Titled like a DialKit panel, so the graph inside says what it plots.
export function Panel({
  children,
  panelRef,
  title,
}: {
  children: React.ReactNode;
  panelRef?: React.Ref<HTMLDivElement>;
  title?: string;
}) {
  return (
    <div ref={panelRef} className="flex flex-col gap-1.5 rounded-2xl bg-surface-raised p-1.5">
      {title ? <span className="px-2.5 pt-2 pb-1 text-sm font-medium">{title}</span> : null}
      {children}
    </div>
  );
}

// The panel's stage. Next moves on to the following value at once; Reset
// appears once the control has left its default.
export function PreviewWell({
  children,
  onNext,
  onReset,
}: {
  children: React.ReactNode;
  onNext: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="relative grid h-40 place-items-center overflow-hidden rounded-xl bg-well px-6">
      {children}
      <div className="absolute right-2 bottom-2 flex items-center gap-1">
        {onReset ? (
          <Button variant="ghost" size="xs" onClick={onReset} className="text-muted-foreground">
            Reset
          </Button>
        ) : null}
        <Button variant="secondary" size="xs" onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function ChartWell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-hidden rounded-xl bg-well", className)}>{children}</div>;
}

export function ToggleField({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = React.useId();

  return (
    <div className="flex h-10 items-center justify-between rounded-lg bg-field px-2.5 shadow-[var(--shadow-control)]">
      <label htmlFor={id} className="text-[13px] leading-none font-medium text-muted-foreground">
        {label}
      </label>
      <Switch id={id} aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SliderField({
  label,
  max,
  min,
  onChange,
  step,
  unit,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit?: string;
  value: number;
}) {
  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      unit={unit}
      value={[value]}
      onValueChange={(next) => onChange(next[0] ?? min)}
    />
  );
}

export function ControlGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-1.5 sm:grid-cols-2">{children}</div>;
}

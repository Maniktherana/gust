import * as React from "react";

import { cn } from "@/lib/utils";

type AngleControlProps = {
  className?: string;
  disabled?: boolean;
  label: string;
  onValueChange: (value: number) => void;
  value: number;
};

function normalizeAngle(value: number) {
  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;

  return Object.is(normalized, -0) ? 0 : normalized;
}

function describeAngle(value: number) {
  if (value === -90) return "Up";
  if (value === 0) return "Right";
  if (value === 90) return "Down";
  if (value === -180) return "Left";

  return value < 0 ? `${Math.abs(value)}° above` : `${value}° below`;
}

function AngleControl({
  className,
  disabled = false,
  label,
  onValueChange,
  value,
}: AngleControlProps) {
  const [dragging, setDragging] = React.useState(false);
  const angle = normalizeAngle(Math.round(value));

  const updateFromPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);

    onValueChange(normalizeAngle(Math.round((Math.atan2(y, x) * 180) / Math.PI)));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromPointer(event);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 15 : 5;
    let next = angle;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next -= step;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") next += step;
    else if (event.key === "Home") next = -180;
    else if (event.key === "End") next = 179;
    else return;

    event.preventDefault();
    onValueChange(normalizeAngle(next));
  };

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-4 rounded-xl border border-border bg-surface-raised p-3",
        className,
      )}
    >
      <div className="min-w-0 self-start pt-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
          {angle}° · {describeAngle(angle)}
        </div>
      </div>

      <button
        type="button"
        role="slider"
        aria-label={`${label} angle`}
        aria-valuemax={180}
        aria-valuemin={-180}
        aria-valuenow={angle}
        aria-valuetext={`${angle} degrees, ${describeAngle(angle).toLowerCase()}`}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onLostPointerCapture={() => setDragging(false)}
        onPointerCancel={onPointerEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        className="relative size-24 shrink-0 touch-none rounded-full border border-border bg-background outline-none shadow-[var(--shadow-control)] transition-[box-shadow,scale] duration-150 focus-visible:shadow-[var(--shadow-control-focus)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className="absolute inset-2 rounded-full border border-border/70"
        />
        <span aria-hidden="true" className="absolute top-1/2 left-2 h-px w-1.5 bg-border" />
        <span aria-hidden="true" className="absolute top-1/2 right-2 h-px w-1.5 bg-border" />
        <span aria-hidden="true" className="absolute top-2 left-1/2 h-1.5 w-px bg-border" />
        <span aria-hidden="true" className="absolute bottom-2 left-1/2 h-1.5 w-px bg-border" />
        <span
          aria-hidden="true"
          data-dragging={dragging ? "true" : undefined}
          className="absolute top-1/2 left-1/2 h-px w-[34px] origin-left bg-foreground transition-transform duration-150 ease-out data-dragging:transition-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-sm" />
        </span>
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
        />
      </button>
    </div>
  );
}

export { AngleControl };

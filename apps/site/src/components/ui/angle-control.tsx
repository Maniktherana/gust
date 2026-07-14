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
      data-active={dragging ? "true" : undefined}
      data-slot="angle-control"
      className={cn(
        "group/angle flex h-10 min-w-0 items-center rounded-lg bg-field pr-1 pl-2.5 shadow-[var(--shadow-control)] transition-[box-shadow,opacity] duration-150 ease-out",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="min-w-0 truncate text-[13px] leading-none font-medium text-muted-foreground transition-colors duration-150 group-data-[active=true]/angle:text-foreground">
        {label}
      </span>
      <span className="ml-auto font-mono text-[13px] leading-none font-medium text-muted-foreground tabular-nums transition-colors duration-150 group-data-[active=true]/angle:text-foreground">
        {angle}°
      </span>

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
        className="relative size-10 shrink-0 touch-none rounded-full outline-none transition-transform duration-150 focus-visible:[&_[data-slot=angle-track]]:shadow-[var(--shadow-control-focus)] active:scale-[0.96] disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          data-slot="angle-track"
          className="absolute inset-1.5 rounded-full bg-muted-foreground/20 shadow-[var(--shadow-control)] transition-[box-shadow] duration-150"
        >
          <span
            data-dragging={dragging ? "true" : undefined}
            className="absolute inset-[8px] transition-transform duration-150 ease-out data-dragging:transition-none"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <span className="absolute top-1/2 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground" />
          </span>
        </span>
      </button>
    </div>
  );
}

export { AngleControl };

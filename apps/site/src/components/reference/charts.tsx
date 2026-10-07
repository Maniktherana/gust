import * as React from "react";
import { useReducedMotion } from "motion/react";

import { useElementSize, useInView } from "@/hooks/use-element";
import type { MotionCurve, MotionSample, TransitionTimeline } from "@/lib/gust-motion";
import { cn } from "@/lib/utils";

// A faint 4 × 4 grid, one curve and the point the row's prop controls.
// Dragging the control moves the point without rescaling the chart.

const aspect = 140 / 256;
const gridDivisions = 4;
const inset = 16;
const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)";

function useChartBox() {
  const [ref, { width }] = useElementSize<HTMLDivElement>();

  return { height: Math.round(width * aspect), ref, width };
}

function Grid({ height, width }: { height: number; width: number }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: gridDivisions - 1 }, (_, index) => {
        const fraction = (index + 1) / gridDivisions;

        return (
          <React.Fragment key={fraction}>
            <line
              x1={width * fraction}
              x2={width * fraction}
              y1={0}
              y2={height}
              className="stroke-outline"
            />
            <line
              x1={0}
              x2={width}
              y1={height * fraction}
              y2={height * fraction}
              className="stroke-outline"
            />
          </React.Fragment>
        );
      })}
    </g>
  );
}

export type CurveMarker = {
  format: (value: number) => string;
  pick: (samples: MotionSample[]) => MotionSample | undefined;
  // Where the value label sits relative to the dot, on the side the curve
  // leaves empty.
  placement: "above" | "below" | "right";
};

export function CurveChart({
  curve,
  domain,
  marker,
  read,
}: {
  curve: MotionCurve;
  // Fixed value range, matched to the control's range, so moving the control
  // moves the curve instead of rescaling the chart.
  domain: [number, number];
  marker: CurveMarker;
  read: (sample: MotionSample) => number;
}) {
  const { height, ref, width } = useChartBox();
  const [low, high] = domain;
  const x = (ms: number) => (curve.duration > 0 ? (ms / curve.duration) * width : 0);
  const y = (value: number) =>
    inset + (1 - (value - low) / (high - low || 1)) * (height - inset * 2);
  const path = curve.samples
    .map(
      (sample, index) =>
        `${index === 0 ? "M" : "L"}${x(sample.time).toFixed(2)},${y(read(sample)).toFixed(2)}`,
    )
    .join("");
  const point = marker.pick(curve.samples);
  const dotX = point ? x(point.time) : 0;
  const dotY = point ? y(read(point)) : 0;
  const nearRightEdge = dotX > width - 72;

  return (
    <div>
      <div ref={ref} className="w-full">
        {width > 0 ? (
          <svg width={width} height={height} aria-hidden="true" className="block">
            <Grid width={width} height={height} />
            <path
              d={path}
              fill="none"
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {point ? (
              <g>
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={4.5}
                  className="fill-foreground stroke-well"
                  strokeWidth={2}
                />
                <text
                  x={marker.placement === "right" ? dotX + 10 : nearRightEdge ? dotX - 10 : dotX}
                  y={
                    marker.placement === "above"
                      ? dotY - 12
                      : marker.placement === "below"
                        ? dotY + 22
                        : dotY + 4
                  }
                  textAnchor={
                    marker.placement === "right" ? "start" : nearRightEdge ? "end" : "middle"
                  }
                  className="fill-foreground text-caption tabular-nums"
                >
                  {marker.format(read(point))}
                </text>
              </g>
            ) : null}
          </svg>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Each dot pulses when its arriving character starts. Replay only on a real
// text change, so a control render cannot get ahead of the preview above.

export function StaggerChart({
  replayValue,
  timeline,
}: {
  replayValue: string;
  timeline: TransitionTimeline;
}) {
  const [ref, inView] = useInView<HTMLDivElement>("0px");
  const reducedMotion = useReducedMotion();
  const previousValue = React.useRef(replayValue);
  const animations = React.useRef<Animation[]>([]);

  React.useLayoutEffect(() => {
    if (previousValue.current === replayValue) return;

    previousValue.current = replayValue;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];

    const node = ref.current;

    if (!node || !inView || reducedMotion || node.ownerDocument.hidden) return;

    animations.current = timeline.enters.flatMap((bar, index) => {
      const dot = node.children[index];

      if (!dot) return [];

      return [
        dot.animate(
          [
            { opacity: 0.15, offset: 0, easing: easeOut },
            { opacity: 1, offset: 0.2, easing: easeOut },
            { opacity: 0.15, offset: 1 },
          ],
          { delay: bar.delay, duration: 440 },
        ),
      ];
    });
  }, [inView, reducedMotion, ref, replayValue, timeline]);

  React.useLayoutEffect(() => {
    animations.current.forEach((animation) => {
      if (reducedMotion) animation.cancel();
      else if (!inView && animation.playState === "running") animation.pause();
      else if (inView && animation.playState === "paused") animation.play();
    });
  }, [inView, reducedMotion]);

  React.useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.cancel());
    },
    [],
  );

  return (
    <div ref={ref} aria-hidden="true" className="flex h-20 items-center justify-center gap-3 px-6">
      {timeline.enters.map((bar) => (
        <span
          key={bar.index}
          className="size-1.5 rounded-full bg-foreground"
          style={{ opacity: 0.15 }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Direction: a ring of ticks that reach toward each arrow and brighten. Press
// anywhere on the ring and the nearest arrow follows the pointer.

const diagramSize = 240;
const center = diagramSize / 2;
const ringRadius = 92;
const handleRadius = 106;
const glyphClearance = 30;
const tickCount = 72;
// How far, in degrees, an arrow's glow spreads across neighbouring ticks.
const glowSpread = 26;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function normalizeAngle(value: number) {
  const normalized = ((((value + 180) % 360) + 360) % 360) - 180;

  return Object.is(normalized, -0) ? 0 : normalized;
}

function angularDistance(a: number, b: number) {
  return Math.abs(normalizeAngle(a - b));
}

// Snap to the nearest 45° when close, so straight lines are easy to hit.
function snapAngle(value: number) {
  const nearest = Math.round(value / 45) * 45;

  return normalizeAngle(Math.abs(value - nearest) <= 4 ? nearest : Math.round(value));
}

function point(angle: number, distance: number): [number, number] {
  // Bun and browser engines can differ in the last trigonometric digit.
  // Stable SVG coordinates keep the server and client markup identical.
  return [
    Math.round((center + Math.cos(toRadians(angle)) * distance) * 10000) / 10000,
    Math.round((center + Math.sin(toRadians(angle)) * distance) * 10000) / 10000,
  ];
}

function Arrow({
  angle,
  className,
  inward,
}: {
  angle: number;
  className: string;
  inward: boolean;
}) {
  const outer = ringRadius - 20;
  const head = inward ? glyphClearance : outer;
  const barbs = inward ? glyphClearance + 8 : outer - 8;
  const [tailX, tailY] = point(angle, inward ? outer : glyphClearance);
  const [headX, headY] = point(angle, head);
  const [leftX, leftY] = point(angle + (inward ? 12 : -5), barbs);
  const [rightX, rightY] = point(angle + (inward ? -12 : 5), barbs);

  return (
    <g className={className}>
      <line
        x1={tailX}
        y1={tailY}
        x2={headX}
        y2={headY}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={`M${leftX},${leftY}L${headX},${headY}L${rightX},${rightY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function DirectionDiagram({
  enterAngle,
  exitAngle,
  onEnterAngleChange,
  onExitAngleChange,
}: {
  enterAngle: number;
  exitAngle: number;
  onEnterAngleChange: (angle: number) => void;
  onExitAngleChange: (angle: number) => void;
}) {
  const [dragging, setDragging] = React.useState<"enter" | "exit" | null>(null);
  // Arriving characters travel along enterAngle, so they come from the
  // opposite side; that is where the enter arrow and its handle sit.
  const enterFrom = normalizeAngle(enterAngle + 180);
  const exitTo = exitAngle;

  const angleFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = diagramSize / rect.width;
    const pointerX = (event.clientX - rect.left) * scale - center;
    const pointerY = (event.clientY - rect.top) * scale - center;

    return (Math.atan2(pointerY, pointerX) * 180) / Math.PI;
  };

  const aim = (target: "enter" | "exit", angle: number) => {
    if (target === "enter") onEnterAngleChange(snapAngle(angle - 180));
    else onExitAngleChange(snapAngle(angle));
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const angle = angleFromPointer(event);
    const target =
      angularDistance(angle, enterFrom) <= angularDistance(angle, exitTo) ? "enter" : "exit";

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(target);
    aim(target, angle);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) aim(dragging, angleFromPointer(event));
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(null);
  };

  return (
    <svg
      viewBox={`0 0 ${diagramSize} ${diagramSize}`}
      aria-hidden="true"
      className={cn(
        "mx-auto block w-full max-w-[240px] touch-none select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {Array.from({ length: tickCount }, (_, index) => {
        const angle = (index * 360) / tickCount - 180;
        const enterGlow = Math.max(0, 1 - angularDistance(angle, enterFrom) / glowSpread);
        const exitGlow = Math.max(0, 1 - angularDistance(angle, exitTo) / glowSpread);
        const glow = Math.max(enterGlow, exitGlow) ** 2;
        const major = index % (tickCount / 4) === 0;
        const [x1, y1] = point(angle, ringRadius - (major ? 8 : 5) - glow * 12);
        const [x2, y2] = point(angle, ringRadius);

        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeLinecap="round"
            strokeWidth={major ? 1.75 : 1.25}
            className={enterGlow >= exitGlow ? "stroke-foreground" : "stroke-muted-foreground"}
            opacity={0.18 + glow * 0.82}
          />
        );
      })}
      <circle cx={center} cy={center} r={4} className="pointer-events-none fill-foreground" />
      <Arrow angle={enterFrom} className="text-foreground" inward />
      <Arrow angle={exitTo} className="text-muted-foreground" inward={false} />
      {(
        [
          { angle: enterFrom, key: "enter", tone: "fill-foreground" },
          { angle: exitTo, key: "exit", tone: "fill-muted-foreground" },
        ] as const
      ).map(({ angle, key, tone }) => {
        const [cx, cy] = point(angle, handleRadius);

        return (
          <circle
            key={key}
            cx={cx}
            cy={cy}
            r={dragging === key ? 7 : 6}
            className={cn(tone, "stroke-well transition-[r] duration-150")}
            strokeWidth={2.5}
          />
        );
      })}
    </svg>
  );
}

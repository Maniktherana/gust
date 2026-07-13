"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role */

import * as React from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> & {
  defaultValue?: number[];
  disabled?: boolean;
  editable?: boolean;
  formatValue?: (value: number) => React.ReactNode;
  label?: React.ReactNode;
  max?: number;
  min?: number;
  name?: string;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  required?: boolean;
  showValue?: boolean;
  step?: number;
  unit?: string;
  value?: number[];
};

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 32;
const HANDLE_BUFFER = 8;
const LABEL_LEFT = 10;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 8;
const VALUE_RIGHT = 10;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    });
  };
}

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node) return undefined;

    const updateWidth = () => setWidth(node.offsetWidth);

    updateWidth();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function decimalsForStep(step: number) {
  const stepText = step.toString();

  if (stepText.includes("e-")) {
    return Number(stepText.split("e-")[1] ?? 0);
  }

  const decimalIndex = stepText.indexOf(".");

  return decimalIndex === -1 ? 0 : stepText.length - decimalIndex - 1;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;

  return Math.min(Math.max(value, min), max);
}

function getSafeStep(step: number) {
  return Number.isFinite(step) && step > 0 ? step : 1;
}

function valueToPercent(value: number, min: number, max: number) {
  const range = max - min;

  if (range <= 0) return 0;

  return ((value - min) / range) * 100;
}

function roundValue(value: number, min: number, step: number) {
  const rounded = min + Math.round((value - min) / step) * step;

  return Number.parseFloat(rounded.toFixed(decimalsForStep(step)));
}

function normalizeValue(value: number, min: number, max: number, step: number) {
  return clamp(roundValue(value, min, step), min, max);
}

function snapToDecile(rawValue: number, min: number, max: number) {
  const range = max - min;

  if (range <= 0) return min;

  const normalized = (rawValue - min) / range;
  const nearest = Math.round(normalized * 10) / 10;

  if (Math.abs(normalized - nearest) <= 0.03125) {
    return min + nearest * range;
  }

  return rawValue;
}

function firstValue(value: number[] | undefined, fallback: number) {
  const next = value?.[0];

  return typeof next === "number" && Number.isFinite(next) ? next : fallback;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      defaultValue,
      disabled = false,
      editable = true,
      formatValue,
      label,
      max = 100,
      min = 0,
      name,
      onKeyDown,
      onValueChange,
      onValueCommit,
      required,
      showValue = true,
      step = 1,
      style,
      unit = "",
      value,
      ...props
    },
    ref,
  ) => {
    const safeStep = getSafeStep(step);
    const safeMin = Math.min(min, max);
    const safeMax = Math.max(min, max);
    const isControlled = value !== undefined;
    const [wrapperRef, wrapperWidth] = useMeasuredWidth<HTMLDivElement>();
    const [labelRef, labelWidth] = useMeasuredWidth<HTMLSpanElement>();
    const [valueRef, valueWidth] = useMeasuredWidth<HTMLButtonElement>();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null);
    const isClickRef = React.useRef(true);
    const fillAnimationRef = React.useRef<ReturnType<typeof animate> | null>(null);
    const wrapperRectRef = React.useRef<DOMRect | null>(null);
    const scaleRef = React.useRef(1);
    const hoverTimeoutRef = React.useRef<number | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
      normalizeValue(firstValue(defaultValue, safeMin), safeMin, safeMax, safeStep),
    );
    const [isDragging, setIsDragging] = React.useState(false);
    const [isInteracting, setIsInteracting] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isValueEditable, setIsValueEditable] = React.useState(false);
    const [isValueHovered, setIsValueHovered] = React.useState(false);
    const [showInput, setShowInput] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const rawValue = isControlled ? firstValue(value, safeMin) : uncontrolledValue;
    const currentValue = normalizeValue(rawValue, safeMin, safeMax, safeStep);
    const currentPercent = valueToPercent(currentValue, safeMin, safeMax);
    const isActive = !disabled && (isInteracting || isHovered);
    const fillPercent = useMotionValue(currentPercent);
    const fillWidth = useTransform(fillPercent, (percent) => `${percent}%`);
    const handleLeft = useTransform(fillPercent, (percent) => `max(5px, calc(${percent}% - 9px))`);
    const rubberStretchPx = useMotionValue(0);
    const rubberBandWidth = useTransform(
      rubberStretchPx,
      (stretch) => `calc(100% + ${Math.abs(stretch)}px)`,
    );
    const rubberBandX = useTransform(rubberStretchPx, (stretch) => (stretch < 0 ? stretch : 0));

    React.useEffect(() => {
      if (isControlled) return;

      setUncontrolledValue((current) => normalizeValue(current, safeMin, safeMax, safeStep));
    }, [isControlled, safeMax, safeMin, safeStep]);

    React.useEffect(() => {
      if (isInteracting || fillAnimationRef.current) return;

      fillPercent.jump(currentPercent);
    }, [currentPercent, fillPercent, isInteracting]);

    React.useEffect(() => {
      return () => {
        fillAnimationRef.current?.stop();
      };
    }, []);

    React.useEffect(() => {
      if (!disabled) return;

      setIsDragging(false);
      setIsHovered(false);
      setIsInteracting(false);
      setIsValueEditable(false);
      setIsValueHovered(false);
      setShowInput(false);
      rubberStretchPx.jump(0);
      pointerDownPos.current = null;
    }, [disabled, rubberStretchPx]);

    React.useEffect(() => {
      if (disabled || !editable || !isValueHovered || showInput || isValueEditable) {
        if (!isValueHovered && !showInput) setIsValueEditable(false);

        return undefined;
      }

      hoverTimeoutRef.current = window.setTimeout(() => {
        setIsValueEditable(true);
      }, 800);

      return () => {
        if (hoverTimeoutRef.current) {
          window.clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      };
    }, [disabled, editable, isValueEditable, isValueHovered, showInput]);

    React.useEffect(() => {
      if (!showInput) return;

      inputRef.current?.focus();
      inputRef.current?.select();
    }, [showInput]);

    const percentFromValue = React.useCallback(
      (nextValue: number) => valueToPercent(nextValue, safeMin, safeMax),
      [safeMax, safeMin],
    );

    const setSliderValue = React.useCallback(
      (
        nextValue: number,
        options: {
          animateFill?: boolean;
          commit?: boolean;
          fillValue?: number;
        } = {},
      ) => {
        const normalized = normalizeValue(nextValue, safeMin, safeMax, safeStep);
        const visualValue = options.fillValue ?? normalized;
        const nextPercent = percentFromValue(visualValue);

        if (fillAnimationRef.current) {
          fillAnimationRef.current.stop();
          fillAnimationRef.current = null;
        }

        if (options.animateFill) {
          fillAnimationRef.current = animate(fillPercent, nextPercent, {
            type: "spring",
            stiffness: 300,
            damping: 25,
            mass: 0.8,
            onComplete: () => {
              fillAnimationRef.current = null;
            },
          });
        } else {
          fillPercent.jump(nextPercent);
        }

        if (!isControlled) setUncontrolledValue(normalized);

        onValueChange?.([normalized]);

        if (options.commit) {
          onValueCommit?.([normalized]);
        }
      },
      [
        fillPercent,
        isControlled,
        onValueChange,
        onValueCommit,
        percentFromValue,
        safeMax,
        safeMin,
        safeStep,
      ],
    );

    const positionToValue = React.useCallback(
      (clientX: number) => {
        const rect = wrapperRectRef.current;
        const wrapper = wrapperRef.current;

        if (!rect || !wrapper) return currentValue;

        const screenX = clientX - rect.left;
        const sceneX = screenX / scaleRef.current;
        const nativeWidth = wrapper.offsetWidth || rect.width;
        const percent = Math.max(0, Math.min(1, sceneX / nativeWidth));

        return safeMin + percent * (safeMax - safeMin);
      },
      [currentValue, safeMax, safeMin, wrapperRef],
    );

    const computeRubberStretch = React.useCallback((clientX: number, sign: number) => {
      const rect = wrapperRectRef.current;

      if (!rect) return 0;

      const distancePast = sign < 0 ? rect.left - clientX : clientX - rect.right;
      const overflow = Math.max(0, distancePast - DEAD_ZONE);

      return sign * MAX_STRETCH * Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1));
    }, []);

    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || showInput) return;

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerDownPos.current = { x: event.clientX, y: event.clientY };
        isClickRef.current = true;
        setIsInteracting(true);

        const wrapper = wrapperRef.current;

        if (wrapper) {
          wrapperRectRef.current = wrapper.getBoundingClientRect();
          scaleRef.current = wrapperRectRef.current.width / wrapper.offsetWidth;
        }
      },
      [disabled, showInput, wrapperRef],
    );

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !isInteracting || !pointerDownPos.current) return;

        const dx = event.clientX - pointerDownPos.current.x;
        const dy = event.clientY - pointerDownPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (isClickRef.current && distance > CLICK_THRESHOLD) {
          isClickRef.current = false;
          setIsDragging(true);
        }

        if (isClickRef.current) return;

        const rect = wrapperRectRef.current;

        if (rect) {
          if (event.clientX < rect.left) {
            rubberStretchPx.jump(computeRubberStretch(event.clientX, -1));
          } else if (event.clientX > rect.right) {
            rubberStretchPx.jump(computeRubberStretch(event.clientX, 1));
          } else {
            rubberStretchPx.jump(0);
          }
        }

        const nextValue = positionToValue(event.clientX);

        setSliderValue(nextValue, { fillValue: nextValue });
      },
      [
        computeRubberStretch,
        disabled,
        isInteracting,
        positionToValue,
        rubberStretchPx,
        setSliderValue,
      ],
    );

    const handlePointerUp = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isInteracting) return;

        if (isClickRef.current) {
          const rawNextValue = positionToValue(event.clientX);
          const discreteSteps = (safeMax - safeMin) / safeStep;
          const snappedValue =
            discreteSteps <= 10
              ? normalizeValue(rawNextValue, safeMin, safeMax, safeStep)
              : snapToDecile(rawNextValue, safeMin, safeMax);

          setSliderValue(snappedValue, {
            animateFill: true,
            commit: true,
          });
        } else {
          const finalValue = normalizeValue(
            positionToValue(event.clientX),
            safeMin,
            safeMax,
            safeStep,
          );

          setSliderValue(finalValue, {
            commit: true,
          });
        }

        if (rubberStretchPx.get() !== 0) {
          animate(rubberStretchPx, 0, {
            type: "spring",
            visualDuration: 0.35,
            bounce: 0.15,
          });
        }

        setIsInteracting(false);
        setIsDragging(false);
        pointerDownPos.current = null;
      },
      [isInteracting, positionToValue, rubberStretchPx, safeMax, safeMin, safeStep, setSliderValue],
    );

    const handlePointerCancel = React.useCallback(() => {
      if (!isInteracting) return;

      setIsInteracting(false);
      setIsDragging(false);
      rubberStretchPx.jump(0);
      pointerDownPos.current = null;
    }, [isInteracting, rubberStretchPx]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);

        if (event.defaultPrevented || disabled) return;

        const largeStep = safeStep * 10;
        let nextValue: number | undefined;

        if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          nextValue = currentValue - safeStep;
        } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          nextValue = currentValue + safeStep;
        } else if (event.key === "PageDown") {
          nextValue = currentValue - largeStep;
        } else if (event.key === "PageUp") {
          nextValue = currentValue + largeStep;
        } else if (event.key === "Home") {
          nextValue = safeMin;
        } else if (event.key === "End") {
          nextValue = safeMax;
        }

        if (nextValue === undefined) return;

        event.preventDefault();
        setSliderValue(nextValue, {
          animateFill: true,
          commit: true,
        });
      },
      [currentValue, disabled, onKeyDown, safeMax, safeMin, safeStep, setSliderValue],
    );

    const handleInputSubmit = React.useCallback(() => {
      const parsed = Number.parseFloat(inputValue);

      if (!Number.isNaN(parsed)) {
        setSliderValue(parsed, {
          animateFill: true,
          commit: true,
        });
      }

      setShowInput(false);
      setIsValueEditable(false);
      setIsValueHovered(false);
    }, [inputValue, setSliderValue]);

    const handleValueClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!editable || !isValueEditable) return;

        event.stopPropagation();
        event.preventDefault();
        setInputValue(currentValue.toFixed(decimalsForStep(safeStep)));
        setShowInput(true);
      },
      [currentValue, editable, isValueEditable, safeStep],
    );

    const handleInputKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          handleInputSubmit();
        } else if (event.key === "Escape") {
          setShowInput(false);
          setIsValueEditable(false);
          setIsValueHovered(false);
        }
      },
      [handleInputSubmit],
    );

    const handleValueKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!isValueEditable) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setInputValue(currentValue.toFixed(decimalsForStep(safeStep)));
          setShowInput(true);
        }
      },
      [currentValue, isValueEditable, safeStep],
    );

    const displayValue =
      formatValue?.(currentValue) ?? `${currentValue.toFixed(decimalsForStep(safeStep))}${unit}`;
    const ariaValueText =
      typeof displayValue === "string" || typeof displayValue === "number"
        ? String(displayValue)
        : String(currentValue);
    const leftThreshold =
      label && wrapperWidth > 0
        ? ((LABEL_LEFT + labelWidth + HANDLE_BUFFER) / wrapperWidth) * 100
        : 0;
    const rightThreshold =
      showValue && wrapperWidth > 0
        ? ((wrapperWidth - VALUE_RIGHT - valueWidth - HANDLE_BUFFER) / wrapperWidth) * 100
        : 100;
    const valueDodge =
      showValue &&
      wrapperWidth > 0 &&
      (currentPercent < leftThreshold || currentPercent > rightThreshold);
    const handleOpacity = !isActive ? 0 : valueDodge ? 0.1 : isDragging ? 0.9 : 0.5;
    const stepCount = Math.max(0, Math.round((safeMax - safeMin) / safeStep));
    const hashMarks =
      stepCount > 1 && stepCount <= 10
        ? Array.from({ length: stepCount - 1 }, (_, index) => ({
            key: `step-${index + 1}`,
            left: ((index + 1) / stepCount) * 100,
          }))
        : Array.from({ length: 9 }, (_, index) => ({
            key: `decile-${index + 1}`,
            left: (index + 1) * 10,
          }));

    return (
      <div
        aria-disabled={disabled || undefined}
        aria-label={
          ariaLabelledBy ? undefined : (ariaLabel ?? (typeof label === "string" ? label : "Slider"))
        }
        aria-labelledby={ariaLabelledBy}
        aria-valuemax={safeMax}
        aria-valuemin={safeMin}
        aria-valuenow={currentValue}
        aria-valuetext={ariaValueText}
        data-active={isActive ? "true" : "false"}
        data-disabled={disabled ? "true" : undefined}
        data-slot="slider"
        onKeyDown={handleKeyDown}
        ref={composeRefs(wrapperRef, ref)}
        role="slider"
        style={style}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group/slider relative h-10 w-full min-w-0 touch-none select-none outline-none focus-visible:[&_[data-slot=slider-track]]:shadow-[var(--shadow-control-focus)] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
          className,
        )}
        {...props}
      >
        <motion.div
          data-slot="slider-track"
          onMouseEnter={() => {
            if (!disabled) setIsHovered(true);
          }}
          onMouseLeave={() => setIsHovered(false)}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: rubberBandWidth,
            x: rubberBandX,
          }}
          className={cn(
            "absolute inset-y-0 left-0 overflow-hidden rounded-lg bg-field shadow-[var(--shadow-control)] transition-[box-shadow,opacity] duration-150 ease-out",
            "cursor-pointer group-data-[disabled=true]/slider:cursor-not-allowed",
          )}
        >
          <div
            aria-hidden="true"
            data-slot="slider-ticks"
            className="pointer-events-none absolute inset-0 z-10"
          >
            {hashMarks.map((mark) => (
              <span
                className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent transition-colors duration-200 group-data-[active=true]/slider:bg-border-strong"
                data-slot="slider-tick"
                key={mark.key}
                style={{ left: `${mark.left}%` }}
              />
            ))}
          </div>

          <motion.div
            aria-hidden="true"
            data-slot="slider-range"
            style={{ width: fillWidth }}
            className="pointer-events-none absolute inset-y-0 left-0 bg-muted-foreground/10 transition-colors duration-150 ease-out group-data-[active=true]/slider:bg-muted-foreground/20"
          />

          <motion.div
            aria-hidden="true"
            animate={{
              opacity: handleOpacity,
              scaleX: isActive ? 1 : 0.25,
              scaleY: isActive && valueDodge ? 0.75 : 1,
            }}
            className="pointer-events-none absolute top-1/2 z-20 h-5 w-[3px] rounded-full bg-foreground"
            data-slot="slider-thumb"
            style={{
              left: handleLeft,
              y: "-50%",
            }}
            transition={{
              opacity: { duration: 0.15 },
              scaleX: { type: "spring", visualDuration: 0.25, bounce: 0.15 },
              scaleY: { type: "spring", visualDuration: 0.2, bounce: 0.1 },
            }}
          />

          {label ? (
            <span
              className="pointer-events-none absolute top-1/2 left-2.5 z-30 inline-flex max-w-[calc(100%-4.5rem)] -translate-y-[calc(50%+0.5px)] items-center truncate text-[13px] leading-none font-medium text-muted-foreground transition-colors duration-150 group-data-[active=true]/slider:text-foreground"
              data-slot="slider-label"
              ref={labelRef}
            >
              {label}
            </span>
          ) : null}

          {showValue ? (
            showInput ? (
              <input
                aria-label={typeof label === "string" ? `Edit ${label} value` : "Edit slider value"}
                className="absolute top-1/2 right-2.5 z-40 min-w-[3ch] -translate-y-1/2 border-0 border-b border-muted-foreground bg-transparent p-0 pb-px font-mono text-[13px] leading-none font-medium text-foreground outline-none"
                data-slot="slider-input"
                onBlur={handleInputSubmit}
                onChange={(event) => setInputValue(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleInputKeyDown}
                onPointerDown={(event) => event.stopPropagation()}
                ref={inputRef}
                style={{
                  width: `${Math.min(Math.max(inputValue.length, 3), 8)}ch`,
                }}
                type="text"
                value={inputValue}
              />
            ) : (
              <button
                aria-label={typeof label === "string" ? `Edit ${label} value` : "Edit slider value"}
                className={cn(
                  "absolute top-1/2 right-2.5 z-30 -translate-y-[calc(50%-0.5px)] appearance-none border-0 border-b border-transparent bg-transparent p-0 pb-px text-right font-mono text-[13px] leading-none font-medium text-muted-foreground tabular-nums transition-[border-color,color] duration-150 group-data-[active=true]/slider:text-foreground",
                  isValueEditable && "border-muted-foreground",
                )}
                data-slot="slider-value"
                disabled={disabled}
                onClick={handleValueClick}
                onKeyDown={handleValueKeyDown}
                onMouseEnter={() => {
                  if (!disabled) setIsValueHovered(true);
                }}
                onMouseLeave={() => setIsValueHovered(false)}
                onPointerDown={(event) => {
                  if (isValueEditable) event.stopPropagation();
                }}
                ref={valueRef}
                style={{ cursor: isValueEditable ? "text" : "default" }}
                tabIndex={isValueEditable ? 0 : -1}
                type="button"
              >
                {displayValue}
              </button>
            )
          ) : null}
        </motion.div>

        {name ? (
          <input
            disabled={disabled}
            name={name}
            readOnly
            required={required}
            type="hidden"
            value={currentValue}
          />
        ) : null}
      </div>
    );
  },
);

Slider.displayName = "Slider";

export { Slider, type SliderProps };

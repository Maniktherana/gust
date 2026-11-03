import * as React from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import {
  Gust,
  DEFAULT_MOTION,
  resolveMotionOptions,
  type GustEasing,
  type GustMotionOptions,
} from "@maniktherana/gust";

import { IconPause, IconPlay } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconSwap } from "@/components/ui/icon-swap";
import { InlineOptions } from "@/components/ui/inline-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { ScrollInput, useScrollFade } from "@/components/ui/scroll-fade";
import {
  completeAuthorMotion,
  exportMotionConfiguration,
  motionAtPlaybackSpeed,
  motionFields,
  parseMotionConfiguration,
  transitionTimeline,
  type MotionFieldKey,
} from "@/lib/gust-motion";

import { labExamples, type LabExample, type LabExampleKey } from "@/lib/lab-examples";
import { cn } from "@/lib/utils";
import { useElementSize } from "@/hooks/use-element";

const controlGroups: { title: string; fields: MotionFieldKey[] }[] = [
  {
    title: "Timing",
    fields: [
      "duration",
      "exitDuration",
      "stagger",
      "staggerDirection",
      "enterDelay",
      "exitDelay",
      "enterStagger",
      "exitStagger",
    ],
  },
  {
    title: "Travel",
    fields: [
      "enterAngle",
      "exitAngle",
      "entranceHeight",
      "exitHeight",
      "entranceOvershoot",
      "entranceRotation",
      "exitRotation",
      "transformOrigin",
    ],
  },
  {
    title: "Scale",
    fields: ["scale", "entranceStartScale", "entranceScale", "exitScale", "entranceScalePeak"],
  },
  {
    title: "Opacity",
    fields: ["entranceOpacity", "exitOpacity"],
  },
  {
    title: "Blur",
    fields: ["blur", "blurUnit", "entranceBlur", "exitBlur"],
  },
  {
    title: "Easing",
    fields: ["enterEasing", "springBounce", "exitEasing"],
  },
  {
    title: "Layout",
    fields: ["layoutDuration", "layoutEasing", "preserveMatching"],
  },
];

const tabTitles = [...controlGroups.map((group) => group.title), "JSON"];

function ControlPanel({
  children,
  direction,
  ref,
}: {
  children: React.ReactNode;
  direction: number;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={{
        enter: (direction: number) => ({
          opacity: 0,
          x: reducedMotion ? 0 : direction * 16,
          filter: reducedMotion ? "blur(0px)" : "blur(4px)",
        }),
        center: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (direction: number) => ({
          opacity: 0,
          x: reducedMotion ? 0 : direction * -16,
          filter: reducedMotion ? "blur(0px)" : "blur(4px)",
        }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: reducedMotion ? 0.12 : 0.24, ease: [0, 0, 0.2, 1] }}
      aria-hidden={!present}
      inert={!present}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}

function NumberField({
  label,
  displayLabel = label,
  unit,
  value,
  onChange,
  min,
  max,
  rangeMax,
  step = 0.01,
  disabled = false,
  auto,
}: {
  label: string;
  displayLabel?: string;
  unit?: string;
  value: number | undefined;
  onChange: (value: number) => boolean;
  min?: number;
  max?: number;
  rangeMax?: number;
  step?: number;
  disabled?: boolean;
  auto?: React.ReactNode;
}) {
  const currentValue = value ?? min ?? 0;
  const [editedValue, setEditedValue] = React.useState(currentValue);
  return (
    <div className="grid min-h-9 min-w-0 grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-y-2">
      <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
        {displayLabel}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <Slider
          aria-label={`${label} slider`}
          className="text-base font-normal"
          unit={unit}
          value={[currentValue]}
          min={min ?? Math.floor(Math.min(-2, currentValue, editedValue))}
          max={max ?? Math.ceil(Math.max(rangeMax ?? 2, currentValue, editedValue))}
          step={step}
          disabled={disabled}
          onChangeCapture={(event) => {
            // Unbounded fields must expand the visual range before Slider commits its editor.
            if (event.target instanceof HTMLInputElement) {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) setEditedValue(next);
            }
          }}
          onValueChange={([next]) => onChange(next)}
        />
        {auto}
      </div>
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
  displayLabel = label,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  displayLabel?: string;
}) {
  return (
    <div className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
        {displayLabel}
      </span>
      <InlineOptions
        label={label}
        value={checked ? "on" : "off"}
        onValueChange={(next) => onChange(next === "on")}
        options={[
          { value: "on", label: "On" },
          { value: "off", label: "Off" },
        ]}
      />
    </div>
  );
}

function EasingField({
  label,
  value,
  onChange,
  disabled = false,
  auto,
  allowSpring = false,
}: {
  label: string;
  value: GustEasing | "spring";
  onChange: (value: GustEasing | "spring") => boolean;
  allowSpring?: boolean;
  disabled?: boolean;
  auto?: React.ReactNode;
}) {
  const mode = typeof value === "string" ? value : "custom";
  return (
    <div className="flex flex-col gap-2">
      <div className="grid min-h-9 min-w-0 grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-y-2">
        <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
          {label}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <InlineOptions
            className="flex-1"
            label={label}
            disabled={disabled}
            value={mode}
            onValueChange={(next) =>
              onChange(
                next === "custom" ? [0, 0, 1, 1] : (next as "linear" | "ease-out" | "spring"),
              )
            }
            options={[
              ...(allowSpring ? [{ value: "spring", label: "Spring" }] : []),
              { value: "linear", label: "Linear" },
              { value: "ease-out", label: "Ease out" },
              { value: "custom", label: "Custom Bézier" },
            ]}
          />
          {auto}
        </div>
      </div>
      {!disabled && typeof value !== "string" ? (
        <div className="flex flex-col gap-2">
          {["x1", "y1", "x2", "y2"].map((coordinate, index) => (
            <NumberField
              key={coordinate}
              label={`${label} ${coordinate}`}
              displayLabel={coordinate}
              value={value[index]}
              min={index % 2 === 0 ? 0 : undefined}
              max={index % 2 === 0 ? 1 : undefined}
              onChange={(number) => {
                const next: [number, number, number, number] = [...value];
                next[index] = number;
                return onChange(next);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MotionControl({
  name,
  options,
  layoutDuration,
  onChange,
}: {
  name: MotionFieldKey;
  options: GustMotionOptions;
  layoutDuration: number;
  onChange: (name: MotionFieldKey, value: GustMotionOptions[MotionFieldKey]) => boolean;
}) {
  const field = motionFields[name];
  const resolved = resolveMotionOptions(options);
  const value = completeAuthorMotion(options)[name];
  const automatic = !!field.auto && options[name] === undefined;
  const derived =
    name === "layoutDuration" ? layoutDuration : resolved[name as keyof typeof resolved];
  const label = field.label;
  const rememberedValue = React.useRef(options[name]);
  const auto = field.auto ? (
    <button
      type="button"
      aria-label={`${label}: auto`}
      aria-pressed={automatic}
      title={field.auto}
      className={cn(
        "h-9 shrink-0 cursor-pointer rounded-lg px-2 text-base font-normal outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/24",
        automatic ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={() => {
        if (!automatic) {
          rememberedValue.current = options[name];
          onChange(name, undefined);
        } else {
          onChange(
            name,
            rememberedValue.current ?? derived ?? (field.kind === "easing" ? "ease-out" : 0),
          );
        }
      }}
    >
      Auto
    </button>
  ) : null;
  const percent = field.unit === "fraction";
  const travel = field.unit === "1/100 em";
  const multiplier = percent ? 100 : travel ? 0.01 : 1;
  const unit = percent ? "%" : travel ? "em" : field.unit === "deg" ? "°" : field.unit;

  if (field.kind === "boolean") {
    return (
      <CheckField
        label={label}
        displayLabel={name === "preserveMatching" ? "Preserve matching" : label}
        checked={value === true}
        onChange={(checked) => onChange(name, checked)}
      />
    );
  }
  if (field.kind === "number") {
    return (
      <NumberField
        label={label}
        displayLabel={field.label}
        unit={
          unit ?? (name === "entranceBlur" || name === "exitBlur" ? resolved.blurUnit : undefined)
        }
        value={
          typeof value === "number"
            ? value * multiplier
            : automatic && typeof derived === "number"
              ? derived * multiplier
              : undefined
        }
        disabled={automatic}
        auto={auto}
        min={field.min === undefined ? undefined : field.min * multiplier}
        max={field.max === undefined ? undefined : field.max * multiplier}
        rangeMax={
          field.unit === "ms"
            ? name.toLowerCase().includes("stagger")
              ? 200
              : 2000
            : travel
              ? 2
              : resolved.blurUnit === "em"
                ? 1
                : 30
        }
        step={percent ? 1 : travel ? 0.01 : field.step}
        onChange={(number) =>
          onChange(name, travel ? Math.round(number * 100) : number / multiplier)
        }
      />
    );
  }
  if (field.kind === "enum") {
    return (
      <div className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
          {label}
        </span>
        <InlineOptions
          label={label}
          value={String(value)}
          onValueChange={(next) => onChange(name, next as GustMotionOptions[MotionFieldKey])}
          options={field.choices?.map((choice) => ({ value: choice, label: choice })) ?? []}
        />
      </div>
    );
  }
  return (
    <EasingField
      allowSpring={name === "enterEasing"}
      label={label}
      value={automatic ? "ease-out" : (value as GustEasing)}
      disabled={automatic}
      auto={auto}
      onChange={(easing) => onChange(name, easing)}
    />
  );
}

function usePlaybackPause(ref: React.RefObject<HTMLButtonElement | null>, playing: boolean) {
  const pausedByLab = React.useRef(new Set<Animation>());
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const sync = () => {
      if (playing) {
        for (const animation of pausedByLab.current) {
          if (animation.playState === "paused") animation.play();
        }
        pausedByLab.current.clear();
      } else {
        for (const animation of node.getAnimations({ subtree: true })) {
          if (animation.playState === "running" || animation.pending) {
            animation.pause();
            pausedByLab.current.add(animation);
          }
        }
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  });
}

export function MotionLab() {
  const [editorRef, editorSize] = useElementSize<HTMLElement>();
  const [headerRef, headerSize] = useElementSize<HTMLDivElement>();
  const [contentRef, contentSize] = useElementSize<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const previewHeight = editorSize.height
    ? Math.min(256, Math.max(0, editorSize.height - headerSize.height - 16 - 80))
    : 256;
  const availableHeight = Math.max(0, editorSize.height - previewHeight - 16);
  const contentHeight = headerSize.height + contentSize.height;
  const [options, setOptions] = React.useState<GustMotionOptions>(() => ({
    ...labExamples.status.motion,
  }));
  const [sequence, setSequence] = React.useState<LabExampleKey | "custom">("status");
  const [values, setValues] = React.useState<readonly string[]>(labExamples.status.values);
  const [valuesDraft, setValuesDraft] = React.useState<string>(
    labExamples.status.values.join(" | "),
  );
  const [valuesDirty, setValuesDirty] = React.useState(false);
  const [valuesError, setValuesError] = React.useState("");
  const [{ index, previous }, setPosition] = React.useState({ index: 0, previous: "" });
  const [replay, setReplay] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [{ tab, direction }, setTab] = React.useState({ tab: "Timing", direction: 1 });
  const group = controlGroups.find((group) => group.title === tab);
  const { ref: scrollRef, onScroll: updateScrollFade, style: scrollFadeStyle } = useScrollFade<HTMLDivElement>(tab, "y");
  React.useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    updateScrollFade();
  }, [tab, scrollRef, updateScrollFade]);
  const tabsId = React.useId();
  const [speed, setSpeed] = React.useState(1);
  const [configError, setConfigError] = React.useState("");
  const [json, setJson] = React.useState("");
  const [jsonError, setJsonError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const previewRef = React.useRef<HTMLButtonElement>(null);
  const example: LabExample | undefined = sequence === "custom" ? undefined : labExamples[sequence];
  const nextIndex = example?.nextIndex;
  const text = values[index] ?? "";
  const staggerMode = options.staggerMode ?? DEFAULT_MOTION.staggerMode;
  const playbackMotion = React.useMemo(
    () => motionAtPlaybackSpeed(options, speed),
    [options, speed],
  );
  const timeline = React.useMemo(
    () => transitionTimeline(previous, text, options),
    [previous, text, options],
  );
  const hold = React.useMemo(
    () => (example ? example.interval(index, options) : timeline.total + 1100) / speed,
    [example, index, options, timeline.total, speed],
  );
  const numericValues = example?.numericValues;
  const trend =
    numericValues &&
    numericValues[index] < numericValues[(index + values.length - 1) % values.length]
      ? "down"
      : "up";
  const remaining = React.useRef(hold);
  const advance = React.useCallback(() => {
    setPosition((current) => ({
      previous: values[current.index],
      index: nextIndex ? nextIndex(current.index) : (current.index + 1) % values.length,
    }));
  }, [values, nextIndex]);

  React.useEffect(() => {
    remaining.current = hold;
  }, [hold, index, sequence, replay]);
  React.useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    const timeout = window.setTimeout(advance, Math.min(remaining.current, 2_147_483_647));
    return () => {
      window.clearTimeout(timeout);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [playing, hold, index, sequence, replay, advance]);
  usePlaybackPause(previewRef, playing);

  function update(name: MotionFieldKey, value: GustMotionOptions[MotionFieldKey]) {
    const next = { ...options, [name]: value };
    if (value === undefined) delete next[name];
    try {
      parseMotionConfiguration(JSON.stringify(next));
      setOptions(next);
      setConfigError("");
      setNotice("");
      return true;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Could not apply that value.");
      return false;
    }
  }

  function changeValues(next: readonly string[], initialIndex = 0) {
    setValues(next);
    setValuesDraft(next.join(" | "));
    setValuesDirty(false);
    setValuesError("");
    setPosition({ index: initialIndex, previous: "" });
    setReplay((value) => value + 1);
    setPlaying(true);
  }

  function commitValues() {
    if (!valuesDirty) return;
    const next = valuesDraft
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!next.length) {
      setValuesError("Enter at least one value.");
      return;
    }
    setSequence("custom");
    changeValues(next);
  }

  const exported = React.useMemo(() => exportMotionConfiguration(options), [options]);
  return (
    <section
      ref={editorRef}
      aria-label="Motion editor"
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-xl bg-surface-raised"
        style={{ height: previewHeight }}
        data-testid="motion-lab-preview"
      >
        <button
          ref={previewRef}
          type="button"
          aria-label="Advance text"
          className="flex h-full w-full cursor-pointer items-center justify-center-safe overflow-x-auto px-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/24 focus-visible:ring-inset"
          onClick={() => {
            advance();
            setPlaying(true);
          }}
        >
          <Gust
            key={`${sequence}-${replay}`}
            motion={playbackMotion}
            trend={trend}
            direction={example?.direction ?? (numericValues ? trend : undefined)}
            className="shrink-0 text-3xl font-medium tracking-tight tabular-nums sm:text-4xl"
            style={sequence === "colors" ? { color: text } : undefined}
          >
            {text}
          </Gust>
          {example?.suffix ? (
            <span className="text-3xl font-medium tracking-tight tabular-nums sm:text-4xl">
              {example.suffix}
            </span>
          ) : null}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          static
          className="absolute top-3 right-3"
          aria-label={playing ? "Pause cycling" : "Resume cycling"}
          onClick={() => setPlaying((value) => !value)}
        >
          <IconSwap
            state={playing ? "b" : "a"}
            a={<IconPlay size="20px" aria-hidden="true" />}
            b={<IconPause size="20px" aria-hidden="true" />}
          />
        </Button>
        <span className="pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums text-muted-foreground">
          {index + 1} / {values.length}
        </span>
      </div>
      <motion.div
        data-testid="motion-lab-controls"
        initial={false}
        animate={{
          height:
            editorSize.height && contentHeight ? Math.min(contentHeight, availableHeight) : "auto",
        }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.25, 1, 0.5, 1] }}
        style={{ maxHeight: `calc(100% - ${previewHeight + 16}px)` }}
        className="min-h-0 min-w-0 shrink-0 overflow-hidden rounded-xl bg-surface-raised"
      >
        <Tabs
          value={tab}
          onValueChange={(value) => {
            const next = String(value);
            setTab((current) =>
              next === current.tab
                ? current
                : {
                    tab: next,
                    direction: tabTitles.indexOf(next) > tabTitles.indexOf(current.tab) ? 1 : -1,
                  },
            );
          }}
          className="h-full min-h-0 w-full min-w-0 gap-0"
        >
          <div ref={headerRef} className="flex min-w-0 shrink-0 flex-col gap-2 pt-3 pb-2">
            <div className="flex min-w-0 shrink-0 flex-col gap-2 px-4">
              <div className="w-full min-w-0 shrink-0">
                <ScrollInput
                  type="text"
                  aria-label="Values"
                  value={valuesDraft}
                  className="min-h-9 min-w-0 rounded-lg border-0 bg-field px-2.5 text-right text-base font-normal text-foreground outline-none focus-visible:ring-0 focus-visible:ring-ring/24 aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:opacity-50"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!valuesError}
                  aria-describedby={valuesError ? `${tabsId}-values-error` : undefined}
                  onChange={(event) => {
                    setValuesDraft(event.target.value);
                    setValuesDirty(true);
                    setValuesError("");
                  }}
                  onBlur={commitValues}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitValues();
                    }
                  }}
                />
                {valuesError ? (
                  <p
                    id={`${tabsId}-values-error`}
                    role="alert"
                    className="pt-1 text-sm text-destructive"
                  >
                    {valuesError}
                  </p>
                ) : null}
              </div>
              <div className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
                  Example
                </span>
                <InlineOptions
                  label="Text sequence"
                  value={sequence}
                  onValueChange={(value) => {
                    if (value === "custom") return;
                    const next = value as LabExampleKey;
                    const selected: LabExample = labExamples[next];
                    setSequence(next);
                    setOptions({ ...selected.motion });
                    setSpeed(1);
                    setConfigError("");
                    setJsonError("");
                    setJson("");
                    setNotice("");
                    changeValues(selected.values, selected.initialIndex);
                  }}
                  options={[
                    ...(sequence === "custom" ? [{ value: "custom", label: "Custom" }] : []),
                    ...Object.entries(labExamples).map(([key, entry]) => ({
                      value: key,
                      label: entry.label,
                    })),
                  ]}
                />
              </div>
              <div className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
                  Speed
                </span>
                <InlineOptions
                  label="Speed"
                  value={String(speed)}
                  onValueChange={(value) => setSpeed(Number(value))}
                  options={[
                    { value: "1", label: "1×" },
                    { value: "0.5", label: "0.5×" },
                    { value: "0.25", label: "0.25×" },
                    { value: "0.1", label: "0.1×" },
                  ]}
                />
              </div>
            </div>
            <div aria-hidden="true" className="shrink-0 border-t border-separator" />
            <div className="min-w-0 shrink-0 px-4">
              <TabsList aria-label="Motion control groups">
                {tabTitles.map((title) => (
                  <TabsTrigger key={title} value={title}>
                    {title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          <div
            ref={scrollRef}
            onScroll={updateScrollFade}
            style={scrollFadeStyle}
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 [scrollbar-width:thin] [scrollbar-color:gray_transparent]"
          >
            <TabsContent ref={contentRef} value={tab} className="relative pb-2">
              <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                <ControlPanel key={tab} direction={direction}>
                  {group ? (
                    <form
                      key={`${sequence}-${replay}`}
                      noValidate
                      onSubmit={(event) => event.preventDefault()}
                      aria-label="Motion controls"
                      className="flex flex-col gap-2"
                    >
                      {group.title === "Timing" ? (
                        <>
                          <div className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                            <span className="text-base font-normal whitespace-nowrap text-muted-foreground">
                              Stagger mode
                            </span>
                            <InlineOptions
                              label="Stagger mode"
                              value={staggerMode}
                              onValueChange={(value) =>
                                update("staggerMode", value as "fixed" | "bounded")
                              }
                              options={[
                                { value: "fixed", label: "Fixed" },
                                { value: "bounded", label: "Bounded" },
                              ]}
                            />
                          </div>
                          {staggerMode === "bounded" ? (
                            <NumberField
                              label="Stagger spread"
                              unit="%"
                              value={(options.staggerSpread ?? DEFAULT_MOTION.staggerSpread) * 100}
                              min={0}
                              max={150}
                              step={1}
                              onChange={(value) => update("staggerSpread", value / 100)}
                            />
                          ) : null}
                        </>
                      ) : null}
                      {group.fields
                        .filter(
                          (name) =>
                            (staggerMode !== "bounded" ||
                              !["stagger", "enterStagger", "exitStagger"].includes(name)) &&
                            (name !== "entranceScalePeak" ||
                              (options.enterEasing ?? DEFAULT_MOTION.enterEasing) !== "spring"),
                        )
                        .map((name) => (
                          <MotionControl
                            key={name}
                            name={name}
                            options={options}
                            layoutDuration={timeline.layoutDuration}
                            onChange={update}
                          />
                        ))}
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 py-1">
                      <label className="flex flex-col gap-2 text-base font-normal text-muted-foreground">
                        Current configuration (1×, read only)
                        <textarea
                          readOnly
                          value={exported}
                          rows={8}
                          spellCheck={false}
                          className="min-h-9 min-w-0 rounded-lg border-0 bg-field px-2.5 py-3 text-left font-mono text-base font-normal text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/24 aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:opacity-50"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="flat"
                          className="text-base font-normal"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(exported);
                              setNotice("Configuration copied.");
                            } catch {
                              setNotice("Clipboard unavailable. Copy the JSON above.");
                            }
                          }}
                        >
                          Copy JSON
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          className="text-base font-normal"
                          onClick={() => {
                            const url = URL.createObjectURL(
                              new Blob([exported], { type: "application/json" }),
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "gust-motion.json";
                            link.click();
                            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                            setNotice("Configuration exported.");
                          }}
                        >
                          Download JSON
                        </Button>
                        <Button
                          type="button"
                          variant="flat"
                          className="text-base font-normal"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Discard this draft and restore Gust’s unchanged defaults?",
                              )
                            )
                              return;
                            setOptions({ ...DEFAULT_MOTION });
                            setConfigError("");
                            setNotice("Restored engine defaults.");
                          }}
                        >
                          Restore defaults
                        </Button>
                      </div>
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          try {
                            const next = parseMotionConfiguration(json);
                            setOptions(next);
                            setJsonError("");
                            setConfigError("");
                            setNotice("Configuration imported.");
                          } catch (error) {
                            setJsonError(
                              error instanceof Error
                                ? error.message
                                : "Could not import configuration.",
                            );
                            setNotice("");
                          }
                        }}
                      >
                        <label
                          htmlFor="motion-json-import"
                          className="text-base font-normal text-muted-foreground"
                        >
                          Import configuration
                        </label>
                        <textarea
                          id="motion-json-import"
                          value={json}
                          onChange={(event) => {
                            setJson(event.target.value);
                            setNotice("");
                          }}
                          rows={6}
                          spellCheck={false}
                          autoComplete="off"
                          className="min-h-9 min-w-0 rounded-lg border-0 bg-field px-2.5 py-3 text-left font-mono text-base font-normal text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/24 aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:opacity-50"
                          aria-invalid={!!jsonError}
                          aria-describedby={jsonError ? "motion-json-error" : undefined}
                        />
                        {jsonError ? (
                          <p
                            id="motion-json-error"
                            role="alert"
                            className="text-sm text-destructive"
                          >
                            {jsonError}
                          </p>
                        ) : null}
                        <Button
                          type="submit"
                          variant="flat"
                          className="self-start text-base font-normal"
                          disabled={!json.trim()}
                        >
                          Import JSON
                        </Button>
                      </form>
                      {notice ? (
                        <p role="status" className="text-sm text-muted-foreground">
                          {notice}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {configError ? (
                    <p role="alert" className="py-2 text-sm text-destructive">
                      {configError}
                    </p>
                  ) : null}
                </ControlPanel>
              </AnimatePresence>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </section>
  );
}

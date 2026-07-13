import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { IconBadgeCheck, IconCloneFilled } from "@/components/icons";
import { SiteShell } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  Gust,
  WORD_HOLD_MS,
} from "@gust/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lab")({
  component: Lab,
});

type MotionValues = {
  duration: number;
  entranceHeight: number;
  entranceScale: number;
  exitDuration: number;
  exitHeight: number;
  exitScale: number;
  interval: number;
  stagger: number;
};

type MotionToggles = {
  blur: boolean;
  preservePrefix: boolean;
  scale: boolean;
};

const defaultValues: MotionValues = {
  duration: DEFAULT_DURATION_MS,
  entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
  entranceScale: DEFAULT_ENTRANCE_SCALE,
  exitDuration: DEFAULT_EXIT_DURATION_MS,
  exitHeight: DEFAULT_EXIT_HEIGHT,
  exitScale: DEFAULT_EXIT_SCALE,
  interval: WORD_HOLD_MS,
  stagger: DEFAULT_STAGGER_MS,
};

const defaultToggles: MotionToggles = {
  blur: true,
  preservePrefix: true,
  scale: true,
};

type SliderConfig = {
  key: keyof MotionValues;
  label: string;
  max: number;
  min: number;
  step: number;
  unit: string;
};

const sliderConfigs: SliderConfig[] = [
  { key: "duration", label: "Enter duration", max: 1200, min: 120, step: 20, unit: "ms" },
  { key: "exitDuration", label: "Exit duration", max: 1200, min: 120, step: 20, unit: "ms" },
  { key: "stagger", label: "Stagger", max: 80, min: 0, step: 2, unit: "ms" },
  { key: "interval", label: "Hold", max: 5000, min: 800, step: 100, unit: "ms" },
  { key: "entranceHeight", label: "Entrance bounce", max: 120, min: 0, step: 2, unit: "" },
  { key: "entranceScale", label: "Entrance scale", max: 2, min: 1, step: 0.05, unit: "×" },
  { key: "exitHeight", label: "Exit rise", max: 200, min: 0, step: 5, unit: "%" },
  { key: "exitScale", label: "Exit scale", max: 1.5, min: 0, step: 0.05, unit: "×" },
];

type Preset = {
  name: string;
  toggles?: Partial<MotionToggles>;
  values?: Partial<MotionValues>;
};

const presets: Preset[] = [
  { name: "Default" },
  {
    name: "Breeze",
    values: {
      duration: 680,
      entranceHeight: 4,
      entranceScale: 1.05,
      exitDuration: 560,
      exitHeight: 55,
      exitScale: 0.75,
      stagger: 22,
    },
  },
  {
    name: "Snap",
    values: {
      duration: 240,
      entranceHeight: 14,
      entranceScale: 1.2,
      exitDuration: 200,
      exitHeight: 120,
      exitScale: 0.2,
      stagger: 6,
    },
  },
  {
    name: "Squall",
    values: {
      duration: 520,
      entranceHeight: 32,
      entranceScale: 1.45,
      exitDuration: 400,
      exitHeight: 170,
      exitScale: 0.1,
      stagger: 34,
    },
  },
  {
    name: "Hush",
    toggles: { blur: true, scale: false },
    values: {
      duration: 600,
      entranceHeight: 0,
      exitDuration: 480,
      exitHeight: 25,
      stagger: 16,
    },
  },
];

const inkColor = "text-foreground";

const colorSwatches = [
  { className: "bg-foreground", name: "Ink", value: inkColor },
  { className: "bg-ok", name: "Green", value: "text-ok" },
  { className: "bg-info", name: "Blue", value: "text-info" },
  { className: "bg-warn", name: "Amber", value: "text-warn" },
  { className: "bg-bad", name: "Red", value: "text-bad" },
];

const defaultWordsInput = [
  "a gust of wind",
  "a gust of words",
  "a gust of motion",
  "a gust of praise",
].join("\n");

function buildJsx({
  color,
  mode,
  toggles,
  typed,
  values,
  words,
}: {
  color: string;
  mode: string;
  toggles: MotionToggles;
  typed: string;
  values: MotionValues;
  words: string[];
}) {
  const parts: string[] = [];

  if (mode === "type") {
    parts.push(`text={${JSON.stringify(typed)}}`);
  } else {
    parts.push(`words={${JSON.stringify(words)}}`);

    if (values.interval !== defaultValues.interval) parts.push(`interval={${values.interval}}`);
  }

  if (color !== inkColor) parts.push(`className=${JSON.stringify(color)}`);

  (Object.keys(defaultValues) as (keyof MotionValues)[]).forEach((key) => {
    if (key === "interval") return;
    if (values[key] !== defaultValues[key]) parts.push(`${key}={${values[key]}}`);
  });

  (Object.keys(defaultToggles) as (keyof MotionToggles)[]).forEach((key) => {
    if (toggles[key] !== defaultToggles[key]) parts.push(`${key}={${String(toggles[key])}}`);
  });

  return `<Gust\n  ${parts.join("\n  ")}\n/>`;
}

function Lab() {
  const [values, setValues] = React.useState<MotionValues>(defaultValues);
  const [toggles, setToggles] = React.useState<MotionToggles>(defaultToggles);
  const [mode, setMode] = React.useState("cycle");
  const [wordsInput, setWordsInput] = React.useState(defaultWordsInput);
  const [typed, setTyped] = React.useState("hello, world");
  const [color, setColor] = React.useState(inkColor);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<number | null>(null);

  const words = React.useMemo(
    () =>
      wordsInput
        .split("\n")
        .map((word) => word.trim())
        .filter(Boolean),
    [wordsInput],
  );

  const applyPreset = (preset: Preset) => {
    setValues({ ...defaultValues, ...preset.values });
    setToggles({ ...defaultToggles, ...preset.toggles });
  };

  const copyJsx = async () => {
    const jsx = buildJsx({ color, mode, toggles, typed, values, words });

    try {
      await navigator.clipboard.writeText(jsx);
    } catch {
      return;
    }

    setCopied(true);

    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);

    copyTimer.current = window.setTimeout(() => {
      copyTimer.current = null;
      setCopied(false);
    }, 2000);
  };

  React.useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const sharedGustProps = {
    blur: toggles.blur,
    duration: values.duration,
    entranceHeight: values.entranceHeight,
    entranceScale: values.entranceScale,
    exitDuration: values.exitDuration,
    exitHeight: values.exitHeight,
    exitScale: values.exitScale,
    preservePrefix: toggles.preservePrefix,
    scale: toggles.scale,
    stagger: values.stagger,
  };

  return (
    <SiteShell>
      <main className="flex flex-col gap-8 pt-2 pb-24 lg:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight">Lab</h1>
          <p className="text-sm text-pretty text-muted-foreground">
            Every tweakable, live. Cycle a list of words or type freely and watch the prefix logic
            keep still what didn't change. Copy the JSX when it feels right.
          </p>
        </div>

        <div className="grid h-56 place-items-center overflow-hidden rounded-xl bg-surface-raised px-8 shadow-[var(--shadow-card)] sm:h-64">
          {mode === "cycle" ? (
            <Gust
              {...sharedGustProps}
              words={words}
              interval={values.interval}
              className={cn("max-w-full text-3xl font-medium tracking-tight sm:text-4xl", color)}
            />
          ) : (
            <Gust
              {...sharedGustProps}
              text={typed}
              className={cn("max-w-full text-3xl font-medium tracking-tight sm:text-4xl", color)}
            />
          )}
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(String(value))} className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="cycle">Cycle words</TabsTrigger>
              <TabsTrigger value="type">Type freely</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1">
              {colorSwatches.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  aria-label={`${swatch.name} text`}
                  aria-pressed={color === swatch.value}
                  onClick={() => setColor(swatch.value)}
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-[scale] duration-150 active:scale-[0.96]",
                    color === swatch.value && "shadow-[var(--shadow-control-focus)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-4 rounded-full", swatch.className)}
                  />
                </button>
              ))}
            </div>
          </div>
          <TabsContent value="cycle">
            <Textarea
              aria-label="Words to cycle, one per line"
              className="h-28 resize-none font-mono text-xs"
              value={wordsInput}
              onChange={(event) => setWordsInput(event.target.value)}
            />
          </TabsContent>
          <TabsContent value="type">
            <Input
              aria-label="Text to animate"
              placeholder="Type anything…"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Presets</span>
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="secondary"
              size="xs"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {sliderConfigs.map((config) => (
            <Slider
              key={config.key}
              label={config.label}
              min={config.min}
              max={config.max}
              step={config.step}
              unit={config.unit}
              value={[values[config.key]]}
              onValueChange={(next) =>
                setValues((current) => ({ ...current, [config.key]: next[0] ?? 0 }))
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-6">
            {(
              [
                { key: "blur", label: "Blur" },
                { key: "scale", label: "Scale" },
                { key: "preservePrefix", label: "Preserve prefix" },
              ] as const
            ).map((toggle) => (
              <div key={toggle.key} className="flex items-center gap-2">
                <Switch
                  id={`toggle-${toggle.key}`}
                  aria-label={toggle.label}
                  checked={toggles[toggle.key]}
                  onCheckedChange={(checked) =>
                    setToggles((current) => ({ ...current, [toggle.key]: checked }))
                  }
                />
                <Label htmlFor={`toggle-${toggle.key}`}>{toggle.label}</Label>
              </div>
            ))}
          </div>
          <Button onClick={copyJsx}>
            {copied ? (
              <IconBadgeCheck data-icon="inline-start" />
            ) : (
              <IconCloneFilled data-icon="inline-start" />
            )}
            <Gust text={copied ? "Copied" : "Copy JSX"} align="start" />
          </Button>
        </div>
      </main>
    </SiteShell>
  );
}

import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CopyButton } from "@/components/copy-button";
import { SiteShell } from "@/components/site-nav";
import { AngleControl } from "@/components/ui/angle-control";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DURATION_MS,
  DEFAULT_ENTER_ANGLE,
  DEFAULT_ENTRANCE_HEIGHT,
  DEFAULT_ENTRANCE_SCALE,
  DEFAULT_EXIT_DURATION_MS,
  DEFAULT_EXIT_ANGLE,
  DEFAULT_EXIT_HEIGHT,
  DEFAULT_EXIT_SCALE,
  DEFAULT_STAGGER_MS,
  Gust,
} from "@maniktherana/gust";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/lab")({
  component: Lab,
});

type MotionValues = {
  duration: number;
  enterAngle: number;
  entranceHeight: number;
  entranceScale: number;
  exitDuration: number;
  exitAngle: number;
  exitHeight: number;
  exitScale: number;
  hold: number;
  stagger: number;
};

const DEFAULT_CYCLE_HOLD_MS = 1600;

type MotionToggles = {
  blur: boolean;
  preservePrefix: boolean;
  scale: boolean;
};

const defaultValues: MotionValues = {
  duration: DEFAULT_DURATION_MS,
  enterAngle: DEFAULT_ENTER_ANGLE,
  entranceHeight: DEFAULT_ENTRANCE_HEIGHT,
  entranceScale: DEFAULT_ENTRANCE_SCALE,
  exitDuration: DEFAULT_EXIT_DURATION_MS,
  exitAngle: DEFAULT_EXIT_ANGLE,
  exitHeight: DEFAULT_EXIT_HEIGHT,
  exitScale: DEFAULT_EXIT_SCALE,
  hold: DEFAULT_CYCLE_HOLD_MS,
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
  { key: "hold", label: "Hold", max: 5000, min: 800, step: 100, unit: "ms" },
  { key: "entranceHeight", label: "Entrance bounce", max: 120, min: 0, step: 2, unit: "" },
  { key: "entranceScale", label: "Entrance scale", max: 2, min: 1, step: 0.05, unit: "×" },
  { key: "exitHeight", label: "Exit travel", max: 200, min: 0, step: 5, unit: "%" },
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

const defaultWordsInput = [
  "a gust of wind",
  "a gust of words",
  "a gust of motion",
  "a gust of praise",
].join("\n");

function buildJsx({
  mode,
  toggles,
  typed,
  values,
}: {
  mode: string;
  toggles: MotionToggles;
  typed: string;
  values: MotionValues;
}) {
  const parts: string[] = [];

  if (mode === "type") {
    parts.push(`value={${JSON.stringify(typed)}}`);
  } else {
    parts.push("value={currentValue}");
  }

  if (values.enterAngle === 90 && values.exitAngle === 90) {
    parts.push("down");
  } else {
    if (values.enterAngle !== defaultValues.enterAngle) {
      parts.push(`enterAngle={${values.enterAngle}}`);
    }

    if (values.exitAngle !== defaultValues.exitAngle) {
      parts.push(`exitAngle={${values.exitAngle}}`);
    }
  }

  (Object.keys(defaultValues) as (keyof MotionValues)[]).forEach((key) => {
    if (key === "hold" || key === "enterAngle" || key === "exitAngle") return;
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
  const [cycleIndex, setCycleIndex] = React.useState(0);

  const words = React.useMemo(
    () =>
      wordsInput
        .split("\n")
        .map((word) => word.trim())
        .filter(Boolean),
    [wordsInput],
  );
  const currentWord = words[cycleIndex % Math.max(words.length, 1)] ?? "";

  React.useEffect(() => {
    if (mode !== "cycle" || words.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setCycleIndex((current) => (current + 1) % words.length);
    }, values.hold);

    return () => window.clearInterval(timer);
  }, [mode, values.hold, words.length]);

  const applyPreset = (preset: Preset) => {
    setValues({ ...defaultValues, ...preset.values });
    setToggles({ ...defaultToggles, ...preset.toggles });
  };

  const sharedGustProps = {
    blur: toggles.blur,
    duration: values.duration,
    enterAngle: values.enterAngle,
    entranceHeight: values.entranceHeight,
    entranceScale: values.entranceScale,
    exitDuration: values.exitDuration,
    exitAngle: values.exitAngle,
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
              value={currentWord}
              className="max-w-full text-3xl font-medium tracking-tight sm:text-4xl"
            />
          ) : (
            <Gust
              {...sharedGustProps}
              value={typed}
              className="max-w-full text-3xl font-medium tracking-tight sm:text-4xl"
            />
          )}
          <CopyButton
            value={() => buildJsx({ mode, toggles, typed, values })}
            label="Copy JSX"
            variant="ghost"
            className="absolute right-3 bottom-3"
          />
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(String(value))} className="gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <TabsList>
              <TabsTrigger value="cycle">Cycle words</TabsTrigger>
              <TabsTrigger value="type">Type freely</TabsTrigger>
            </TabsList>
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
          <AngleControl
            label="Enter direction"
            value={values.enterAngle}
            onValueChange={(enterAngle) => setValues((current) => ({ ...current, enterAngle }))}
          />
          <AngleControl
            label="Exit direction"
            value={values.exitAngle}
            onValueChange={(exitAngle) => setValues((current) => ({ ...current, exitAngle }))}
          />
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
      </main>
    </SiteShell>
  );
}

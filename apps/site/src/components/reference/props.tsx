import * as React from "react";

import { Gust } from "@maniktherana/gust";

import { AngleControl } from "@/components/ui/angle-control";
import {
  defaultMotion,
  sampleEnter,
  sampleExit,
  transitionTimeline,
  type MotionSample,
  type MotionSettings,
} from "@/lib/gust-motion";
import { expression, gustSnippet, type SnippetValue } from "@/lib/snippet";
import { cn } from "@/lib/utils";

import { CurveChart, DirectionDiagram, StaggerChart, type CurveMarker } from "./charts";
import {
  ChartWell,
  ControlGrid,
  Panel,
  PreviewWell,
  PropRow,
  PropSection,
  SliderField,
  ToggleField,
} from "./panel";
import { useMotionPreview } from "./use-preview";

const previewTextClassName = "max-w-full text-4xl font-medium tracking-tight";

type Chart = {
  // Which animation to plot and which property of it.
  curve: "enter" | "exit";
  domain: [number, number];
  marker: CurveMarker;
  read: (sample: MotionSample) => number;
  title: string;
};

// One motion prop: a preview, an optional chart and a single control. Every
// other prop stays at its default, so the row shows only this one.
function MotionPropRow<Key extends keyof MotionSettings>({
  chart,
  control,
  description,
  name,
  type,
  words,
}: {
  chart?: Chart;
  control: (
    value: MotionSettings[Key],
    onChange: (value: MotionSettings[Key]) => void,
  ) => React.ReactNode;
  description: string;
  name: Key;
  type: string;
  words: readonly string[];
}) {
  const [value, setValue] = React.useState(defaultMotion[name]);
  const settings = React.useMemo(() => ({ ...defaultMotion, [name]: value }), [name, value]);
  const preview = useMotionPreview(words, settings);
  const curve = React.useMemo(() => {
    if (!chart) return null;

    return chart.curve === "enter" ? sampleEnter(settings) : sampleExit(settings);
  }, [chart, settings]);

  return (
    <PropRow
      name={name}
      type={type}
      defaultValue={String(defaultMotion[name])}
      description={description}
      snippet={gustSnippet([
        ["value", expression("label")],
        [name, value as SnippetValue],
      ])}
    >
      <Panel panelRef={preview.panelRef} title={chart?.title}>
        <PreviewWell
          onNext={preview.cycle.next}
          onReset={value === defaultMotion[name] ? undefined : () => setValue(defaultMotion[name])}
        >
          <Gust value={preview.cycle.current} {...settings} className={previewTextClassName} />
        </PreviewWell>
        {chart && curve ? (
          <ChartWell>
            <CurveChart
              curve={curve}
              domain={chart.domain}
              marker={chart.marker}
              read={chart.read}
            />
          </ChartWell>
        ) : null}
        {control(value, setValue)}
      </Panel>
    </PropRow>
  );
}

// ---------------------------------------------------------------------------
// Chart pieces

const travel = (sample: MotionSample) => sample.travel;
const scaleOf = (sample: MotionSample) => sample.scale;
const blurOf = (sample: MotionSample) => sample.blur;

const first = (samples: MotionSample[]) => samples[0];
const last = (samples: MotionSample[]) => samples[samples.length - 1];

function highest(read: (sample: MotionSample) => number, floor: number) {
  return (samples: MotionSample[]) => {
    const best = samples.reduce<MotionSample | undefined>(
      (top, sample) => (!top || read(sample) > read(top) ? sample : top),
      undefined,
    );

    return best && read(best) > floor ? best : undefined;
  };
}

function scaleExtreme(samples: MotionSample[]) {
  const best = samples.reduce<MotionSample | undefined>(
    (extreme, sample) =>
      !extreme || Math.abs(sample.scale - 1) > Math.abs(extreme.scale - 1) ? sample : extreme,
    undefined,
  );
  return best && Math.abs(best.scale - 1) > 0.004 ? best : undefined;
}

const em = (value: number) => `${value > 0.004 ? "+" : ""}${value.toFixed(2)} em`;
const times = (value: number) => `${value.toFixed(2)}×`;
const px = (value: number) => `${value.toFixed(1)} px`;

// ---------------------------------------------------------------------------
// Basics

const valueWords = ["Save", "Saving…", "Saved"] as const;

function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const id = React.useId();

  return (
    <div className="flex h-10 items-center gap-3 rounded-lg bg-field pr-1 pl-2.5 shadow-[var(--shadow-control)] has-[:focus-visible]:shadow-[var(--shadow-control-focus)]">
      <label
        htmlFor={id}
        className="shrink-0 text-[13px] leading-none font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        maxLength={32}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent pr-1.5 text-right text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
      />
    </div>
  );
}

function ValueRow() {
  const [custom, setCustom] = React.useState<string | null>(null);
  const preview = useMotionPreview(valueWords, defaultMotion, { paused: custom !== null });

  return (
    <PropRow
      name="value"
      type="string"
      defaultValue="required"
      description="The text to show. Your component decides what the text is and when it changes; Gust animates each change. Leading and trailing spaces are trimmed."
      snippet={
        custom === null
          ? `const [label, setLabel] = useState("Save");\n\n${gustSnippet([["value", expression("label")]])}`
          : gustSnippet([["value", custom]])
      }
    >
      <Panel panelRef={preview.panelRef}>
        <PreviewWell onNext={() => (custom === null ? preview.cycle.next() : setCustom(null))}>
          <Gust value={custom ?? preview.cycle.current} className={previewTextClassName} />
        </PreviewWell>
        <TextField
          label="Value"
          placeholder="Type to animate"
          value={custom ?? ""}
          onChange={setCustom}
        />
      </Panel>
    </PropRow>
  );
}

// Proportional digits differ in width, which tabular-nums evens out.
const styleWords = ["1,111", "8,808", "4,417", "1,171"] as const;
const tintClassName = "text-emerald-600 dark:text-emerald-400";

function ClassNameRow() {
  const [mono, setMono] = React.useState(false);
  const [tabular, setTabular] = React.useState(false);
  const [tint, setTint] = React.useState(false);
  const preview = useMotionPreview(styleWords, defaultMotion);
  const className = cn(mono && "font-mono", tabular && "tabular-nums", tint && tintClassName);

  return (
    <PropRow
      name="className"
      type="string"
      defaultValue="—"
      description="Classes for the root span. Gust takes its font, size and color from here or from the surrounding text. Other span attributes, such as id, style and aria-*, pass through too."
      snippet={gustSnippet([
        ["value", expression("count")],
        ["className", className || undefined],
      ])}
    >
      <Panel panelRef={preview.panelRef}>
        <PreviewWell onNext={preview.cycle.next}>
          <Gust value={preview.cycle.current} className={cn(previewTextClassName, className)} />
        </PreviewWell>
        <ControlGrid>
          <ToggleField label="font-mono" checked={mono} onCheckedChange={setMono} />
          <ToggleField label="tabular-nums" checked={tabular} onCheckedChange={setTabular} />
        </ControlGrid>
        <ToggleField label="Add a color" checked={tint} onCheckedChange={setTint} />
      </Panel>
    </PropRow>
  );
}

// ---------------------------------------------------------------------------
// Timing

const timingWords = ["Calm", "Breezy", "Gusty"] as const;

function StaggerRow() {
  const [stagger, setStagger] = React.useState(defaultMotion.stagger);
  const settings = React.useMemo(() => ({ ...defaultMotion, stagger }), [stagger]);
  const preview = useMotionPreview(timingWords, settings);
  const timeline = React.useMemo(
    () => transitionTimeline(preview.from, preview.to, settings),
    [preview.from, preview.to, settings],
  );

  return (
    <PropRow
      name="stagger"
      type="number"
      defaultValue={String(defaultMotion.stagger)}
      description="Extra delay before each next character starts, in milliseconds. The dots pulse with the arriving characters."
      snippet={gustSnippet([
        ["value", expression("label")],
        ["stagger", stagger],
      ])}
    >
      <Panel panelRef={preview.panelRef} title="When each character starts">
        <PreviewWell
          onNext={preview.cycle.next}
          onReset={
            stagger === defaultMotion.stagger ? undefined : () => setStagger(defaultMotion.stagger)
          }
        >
          <Gust value={preview.cycle.current} {...settings} className={previewTextClassName} />
        </PreviewWell>
        <ChartWell>
          <StaggerChart timeline={timeline} replayValue={preview.cycle.current} />
        </ChartWell>
        <SliderField
          label="Stagger"
          min={0}
          max={80}
          step={1}
          unit="ms"
          value={stagger}
          onChange={setStagger}
        />
      </Panel>
    </PropRow>
  );
}

// ---------------------------------------------------------------------------
// Direction

const directionWords = ["Breeze", "Gust", "Gale"] as const;

function AnglesRow() {
  const [enterAngle, setEnterAngle] = React.useState(defaultMotion.enterAngle);
  const [exitAngle, setExitAngle] = React.useState(defaultMotion.exitAngle);
  const settings = React.useMemo(
    () => ({ ...defaultMotion, enterAngle, exitAngle }),
    [enterAngle, exitAngle],
  );
  const preview = useMotionPreview(directionWords, settings);
  const isDefault =
    enterAngle === defaultMotion.enterAngle && exitAngle === defaultMotion.exitAngle;

  const reset = () => {
    setEnterAngle(defaultMotion.enterAngle);
    setExitAngle(defaultMotion.exitAngle);
  };

  return (
    <PropRow
      name="enterAngle, exitAngle"
      type="number"
      defaultValue="-90"
      description="Travel angles in screen degrees: 0 is right, 90 is down and −90 is up. Arriving characters travel along enterAngle, so they come from the opposite side. Drag anywhere on the ring to aim the nearest arrow."
      snippet={gustSnippet([
        ["value", expression("label")],
        ["enterAngle", enterAngle],
        ["exitAngle", exitAngle],
      ])}
    >
      <Panel panelRef={preview.panelRef} title="Directions">
        <PreviewWell onNext={preview.cycle.next} onReset={isDefault ? undefined : reset}>
          <Gust value={preview.cycle.current} {...settings} className={previewTextClassName} />
        </PreviewWell>
        <ChartWell className="flex flex-col items-center gap-3 py-5">
          <DirectionDiagram
            enterAngle={enterAngle}
            exitAngle={exitAngle}
            onEnterAngleChange={setEnterAngle}
            onExitAngleChange={setExitAngle}
          />
        </ChartWell>
        <ControlGrid>
          <AngleControl label="Enter" value={enterAngle} onValueChange={setEnterAngle} />
          <AngleControl label="Exit" value={exitAngle} onValueChange={setExitAngle} />
        </ControlGrid>
      </Panel>
    </PropRow>
  );
}

const fallingPrices = ["$24.80", "$23.15", "$21.90"] as const;

function DownRow() {
  const [down, setDown] = React.useState(false);
  const settings = React.useMemo(
    () => ({ ...defaultMotion, enterAngle: down ? 90 : -90, exitAngle: down ? 90 : -90 }),
    [down],
  );
  const preview = useMotionPreview(fallingPrices, settings);

  return (
    <PropRow
      name="down"
      type="boolean"
      defaultValue="false"
      description="Sends both directions down. Set it from your data, such as down={price < previous}, so falling values fall. Explicit angles take precedence."
      snippet={gustSnippet([
        ["value", expression("price")],
        ["down", down || undefined],
      ])}
    >
      <Panel panelRef={preview.panelRef}>
        <PreviewWell onNext={preview.cycle.next}>
          <Gust
            value={preview.cycle.current}
            {...settings}
            className={cn(previewTextClassName, "tabular-nums")}
          />
        </PreviewWell>
        <ToggleField label="Send characters down" checked={down} onCheckedChange={setDown} />
      </Panel>
    </PropRow>
  );
}

// ---------------------------------------------------------------------------
// Effects

const prefixWords = ["Uploading", "Uploaded", "Upload"] as const;

function PreservePrefixRow() {
  const [preservePrefix, setPreservePrefix] = React.useState(true);
  const settings = React.useMemo(() => ({ ...defaultMotion, preservePrefix }), [preservePrefix]);
  const preview = useMotionPreview(prefixWords, settings);

  return (
    <PropRow
      name="preservePrefix"
      type="boolean"
      defaultValue="true"
      description="Keeps matching leading characters still, so only what changed moves. The boxes show each character's role as the real transition runs."
      snippet={gustSnippet([
        ["value", expression("status")],
        ["preservePrefix", preservePrefix ? undefined : false],
      ])}
    >
      <Panel panelRef={preview.panelRef} title="What each character does">
        <PreviewWell onNext={preview.cycle.next}>
          <Gust
            value={preview.cycle.current}
            {...settings}
            className="gust-xray font-mono text-2xl font-medium"
          />
        </PreviewWell>
        <ToggleField
          label="Keep the shared prefix still"
          checked={preservePrefix}
          onCheckedChange={setPreservePrefix}
        />
      </Panel>
    </PropRow>
  );
}

// ---------------------------------------------------------------------------

const entranceWords = ["Rise", "Bloom", "Soar"] as const;
const exitWords = ["Fade", "Drift", "Vanish"] as const;

export function PropReference() {
  return (
    <div className="flex flex-col gap-16">
      <PropSection title="Basics" description="What to show and how it looks.">
        <ValueRow />
        <ClassNameRow />
      </PropSection>

      <PropSection
        title="Timing"
        description="Every changed character runs its own animation, and leaving characters animate at the same time as arriving ones."
      >
        <MotionPropRow
          name="duration"
          type="number"
          words={timingWords}
          description="How long each arriving character takes to settle, in milliseconds."
          control={(value, onChange) => (
            <SliderField
              label="Duration"
              min={0}
              max={1200}
              step={10}
              unit="ms"
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="exitDuration"
          type="number"
          words={exitWords}
          description="How long each leaving character takes to disappear, in milliseconds."
          control={(value, onChange) => (
            <SliderField
              label="Exit duration"
              min={0}
              max={1200}
              step={10}
              unit="ms"
              value={value}
              onChange={onChange}
            />
          )}
        />
        <StaggerRow />
      </PropSection>

      <PropSection title="Direction" description="Which way characters travel.">
        <AnglesRow />
        <DownRow />
      </PropSection>

      <PropSection
        title="Entrance"
        description="Arriving characters start away from their spot, pass it, and settle. Distances use 100 = 1em, so they scale with the text."
      >
        <MotionPropRow
          name="entranceHeight"
          type="number"
          words={entranceWords}
          description="How far from its resting spot a character starts. The dot is where it starts."
          chart={{
            curve: "enter",
            domain: [-2.1, 0.45],
            marker: { format: em, pick: first, placement: "right" },
            read: travel,
            title: "Position while arriving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Height"
              min={0}
              max={200}
              step={1}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="entranceOvershoot"
          type="number"
          words={entranceWords}
          description="How far a character overshoots its spot before settling. The dot is the top of the overshoot; 0 removes it."
          chart={{
            curve: "enter",
            domain: [-1, 1.35],
            marker: { format: em, pick: highest(travel, 0.004), placement: "above" },
            read: travel,
            title: "Position while arriving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Overshoot"
              min={0}
              max={120}
              step={1}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="entranceScale"
          type="number"
          words={entranceWords}
          description="A character's scale during its arrival, from 0 to 2."
          chart={{
            curve: "enter",
            domain: [-0.1, 2.1],
            marker: { format: times, pick: scaleExtreme, placement: "above" },
            read: scaleOf,
            title: "Size while arriving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Peak scale"
              min={0}
              max={2}
              step={0.01}
              unit="×"
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="entranceBlur"
          type="number"
          words={entranceWords}
          description="Blur when a character starts arriving, in pixels. It sharpens as it settles. The default is 0."
          chart={{
            curve: "enter",
            domain: [-0.6, 12.6],
            marker: { format: px, pick: first, placement: "above" },
            read: blurOf,
            title: "Blur while arriving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Blur"
              min={0}
              max={12}
              step={0.25}
              unit="px"
              value={value}
              onChange={onChange}
            />
          )}
        />
      </PropSection>

      <PropSection
        title="Exit"
        description="Leaving characters travel, shrink, blur and fade together. Most of the movement happens right away."
      >
        <MotionPropRow
          name="exitHeight"
          type="number"
          words={exitWords}
          description="How far a leaving character travels before it disappears. 100 equals 1em."
          chart={{
            curve: "exit",
            domain: [-0.15, 2.15],
            marker: { format: em, pick: last, placement: "below" },
            read: travel,
            title: "Position while leaving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Travel"
              min={0}
              max={200}
              step={1}
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="exitScale"
          type="number"
          words={exitWords}
          description="How large a leaving character is when it disappears, from 0 to 1.5."
          chart={{
            curve: "exit",
            domain: [-0.1, 1.6],
            marker: { format: times, pick: last, placement: "above" },
            read: scaleOf,
            title: "Size while leaving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="End scale"
              min={0}
              max={1.5}
              step={0.01}
              unit="×"
              value={value}
              onChange={onChange}
            />
          )}
        />
        <MotionPropRow
          name="exitBlur"
          type="number"
          words={exitWords}
          description="How blurred a leaving character is when it disappears, in pixels. Blur does not grow with font size: 4px suits display text, about 1px suits 12–14px text."
          chart={{
            curve: "exit",
            domain: [-0.6, 12.6],
            marker: { format: px, pick: last, placement: "above" },
            read: blurOf,
            title: "Blur while leaving",
          }}
          control={(value, onChange) => (
            <SliderField
              label="Blur"
              min={0}
              max={12}
              step={0.25}
              unit="px"
              value={value}
              onChange={onChange}
            />
          )}
        />
      </PropSection>

      <PropSection title="Effects" description="Switches for parts of the motion.">
        <MotionPropRow
          name="blur"
          type="boolean"
          words={exitWords}
          description="Enables entrance and exit blur. Each has its own amount; entrance blur defaults to 0."
          control={(value, onChange) => (
            <ToggleField label="Blur characters" checked={value} onCheckedChange={onChange} />
          )}
        />
        <MotionPropRow
          name="scale"
          type="boolean"
          words={entranceWords}
          description="Scales characters as they arrive and leave. Turn it off to keep every character at its normal size."
          control={(value, onChange) => (
            <ToggleField label="Scale characters" checked={value} onCheckedChange={onChange} />
          )}
        />
        <PreservePrefixRow />
      </PropSection>
    </div>
  );
}

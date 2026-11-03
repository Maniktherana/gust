import * as React from "react";
import { IconPause, IconPlay } from "@/components/icons";
import { Slider } from "@/components/ui/slider";
import { InlineOptions } from "@/components/ui/inline-options";
import { IconSwap } from "@/components/ui/icon-swap";
import { ScrollInput } from "@/components/ui/scroll-fade";
import { Button } from "@/components/ui/button";
import { DEFAULT_MOTION, Gust, type GustDirection } from "@maniktherana/gust";
import { motionAtPlaybackSpeed, transitionTimeline } from "@/lib/gust-motion";

const onOff = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

export function TextPlayground() {
  const id = React.useId();
  const [values, setValues] = React.useState(["Building", "Deploying"]);
  const [draft, setDraft] = React.useState("Building | Deploying");
  const [error, setError] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const [previous, setPrevious] = React.useState("Building");
  const [playing, setPlaying] = React.useState(false);
  const [direction, setDirection] = React.useState<"auto" | GustDirection>("auto");
  const [preserve, setPreserve] = React.useState<boolean>(DEFAULT_MOTION.preserveMatching);
  const [slow, setSlow] = React.useState(false);
  const [duration, setDuration] = React.useState<number>(DEFAULT_MOTION.duration);
  const current = values[index];
  const number = Number(current);
  const value = Number.isFinite(number) && String(number) === current ? number : current;

  const motion = React.useMemo(
    () =>
      motionAtPlaybackSpeed(
        {
          ...DEFAULT_MOTION,
          // Auto direction needs the numeric trend, not explicit default angles.
          enterAngle: undefined,
          exitAngle: undefined,
          duration,
          exitDuration: duration,
        },
        slow ? 0.25 : 1,
      ),
    [duration, slow],
  );

  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!preference.matches);
    const onChange = () => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
  }, []);

  const advance = React.useCallback(() => {
    setPrevious(current);
    setIndex((position) => (position + 1) % values.length);
  }, [current, values.length]);

  React.useEffect(() => {
    if (!playing || values.length < 2) return;
    const timeline = transitionTimeline(previous, current, {
      ...motion,
      preserveMatching: preserve,
    });
    const timer = window.setTimeout(advance, timeline.total + 1200);
    return () => window.clearTimeout(timer);
  }, [advance, current, motion, playing, preserve, previous, values.length]);

  function commitValues() {
    const next = draft
      .split("|")
      .map((text) => text.trim())
      .filter(Boolean);
    if (!next.length) {
      setError("Enter at least one value.");
      return;
    }
    setError("");
    setDraft(next.join(" | "));
    if (next.join(" | ") === values.join(" | ")) return;
    setPrevious(current);
    setValues(next);
    setIndex(0);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative min-w-0 rounded-xl bg-surface-raised">
        <div className="overflow-x-auto rounded-xl">
          <button
            type="button"
            aria-label={`Next value. Current value: ${current}`}
            onClick={advance}
            className="flex h-64 w-max min-w-full items-center justify-center px-6 text-center text-4xl font-medium focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring sm:text-5xl"
          >
            <Gust
              motion={motion}
              direction={direction === "auto" ? undefined : direction}
              preservePrefix={preserve}
              className="shrink-0 whitespace-nowrap tabular-nums"
              aria-hidden="true"
            >
              {value}
            </Gust>
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          static
          onClick={() => setPlaying((active) => !active)}
          aria-label={playing ? "Pause autoplay" : "Resume autoplay"}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <IconSwap
            state={playing ? "b" : "a"}
            a={<IconPlay size="20px" />}
            b={<IconPause size="20px" />}
          />
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface-raised p-4 text-base font-normal">
        <form
          className="min-w-0"
          onSubmit={(event) => {
            event.preventDefault();
            commitValues();
          }}
        >
          <ScrollInput
            aria-label="Values"
            id={`${id}-values`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitValues}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="h-9 w-full min-w-0 rounded-lg border-0 px-2.5 text-right text-base font-normal shadow-none outline-none"
          />
        </form>
        {error ? (
          <p id={`${id}-error`} role="alert" className="pb-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="grid min-h-9 min-w-0 grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-y-2">
          <span className="text-muted-foreground">Direction</span>
          <InlineOptions
            label="Direction"
            value={direction}
            onValueChange={(next) => setDirection(next as "auto" | GustDirection)}
            options={[
              { value: "auto", label: "Auto" },
              { value: "up", label: "Up" },
              { value: "down", label: "Down" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
          />
        </div>
        {[
          {
            label: "Preserve matching",
            active: preserve,
            toggle: () => setPreserve((active) => !active),
          },
          { label: "Slow mode", active: slow, toggle: () => setSlow((active) => !active) },
        ].map(({ label, active, toggle }) => (
          <div
            key={label}
            className="grid min-h-9 min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
          >
            <span className="text-muted-foreground">{label}</span>
            <InlineOptions
              label={label}
              value={active ? "on" : "off"}
              options={onOff}
              onValueChange={toggle}
            />
          </div>
        ))}
        <div className="grid min-h-9 min-w-0 grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-y-2">
          <label htmlFor={`${id}-duration`} className="text-muted-foreground">
            Duration
          </label>
          <Slider
            id={`${id}-duration`}
            aria-label="Duration"
            min={100}
            max={1000}
            step={10}
            value={[duration]}
            unit="ms"
            onValueChange={([next]) => setDuration(next)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

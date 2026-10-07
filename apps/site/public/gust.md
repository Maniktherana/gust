# Gust

> Animated text transitions for React. When a string changes, Gust animates only the characters that changed: old ones lift out, new ones settle in, a shared prefix stays still, and the width eases to fit.

- Website: https://gust.manikrana.dev
- Package: `@maniktherana/gust` on npm
- shadcn registry item: https://gust.manikrana.dev/r/gust.json
- Source: https://github.com/Maniktherana/gust
- Requires React 18 or later. No other runtime dependencies. Uses the Web Animations API.

## When to use it

Use Gust for short text that changes between values:

- Action labels: Save → Saving… → Saved.
- Prices, counters and other numbers where a few digits change.
- Status text: deploys, uploads, presence, build steps.
- Short headlines that cycle through a few phrases.

Do not use Gust for:

- Paragraphs or long sentences. It animates characters, not reading flow.
- Continuous prose or every frame of a data stream. Publish numeric readings at a deliberate cadence, and stream paragraphs as ordinary text.

## Workflow for coding agents

1. Find the framework and the package manager from the lockfile.
2. If the project has a `components.json` (shadcn/ui), you can use the registry item. Otherwise install the npm package.
3. With the npm package, import `@maniktherana/gust/styles.css` once, in the root layout or the global entry file. The shadcn CLI adds the same CSS to the global stylesheet for you.
4. Find the text that changes. Keep its state where it already lives, and pass the current string as `value`.
5. Format numbers, dates and other values into strings before you pass them.
6. Keep fixed units, punctuation, icons, and surrounding layout outside Gust. Use the surrounding regular font and `tabular-nums` for digits.
7. Give labels and counters separate motion settings. Start with the defaults, then tune the changing text itself.
8. Check actual transitions with successive screenshots: entry, settled text, and exit must remain visible. Then run the project's typecheck and build.

## Install

```sh
npm i @maniktherana/gust
pnpm add @maniktherana/gust
yarn add @maniktherana/gust
bun add @maniktherana/gust
```

Or copy the source into the project with the shadcn CLI:

```sh
npx shadcn@latest add https://gust.manikrana.dev/r/gust.json
```

The CLI writes the component to `components/ui/gust/`. Import it from `@/components/ui/gust`.

## Usage

```tsx
import { useEffect, useState } from "react";
import { Gust } from "@maniktherana/gust";
import "@maniktherana/gust/styles.css";

const messages = ["Queued", "Building", "Live"];

export function Status() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return <Gust value={messages[index] ?? ""} />;
}
```

Gust is controlled. It has no timer or queue. Your component decides what the text is and when it changes; Gust animates from the previous string to the next one.

In the Next.js App Router, render Gust from a Client Component (a file that starts with `"use client"`).

## Props

All props except `value` are optional. Distances use 100 = 1em, so they scale with the font size.

| Prop                | Type      | Default | Description                                                                                             |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `value`             | `string`  | -       | The text to show. Gust animates whenever it changes. Leading and trailing spaces are trimmed.           |
| `className`         | `string`  | -       | Classes for the root span. Other span attributes (`id`, `style`, `data-*`, `aria-*`) also pass through. |
| `duration`          | `number`  | `440`   | How long each arriving character animates, in milliseconds.                                             |
| `exitDuration`      | `number`  | `400`   | How long each leaving character animates, in milliseconds.                                              |
| `stagger`           | `number`  | `20`    | Extra delay for each next animated character, in milliseconds.                                          |
| `enterAngle`        | `number`  | `-90`   | Travel angle of arriving characters in screen degrees: `0` right, `90` down, `-90` up.                  |
| `exitAngle`         | `number`  | `-90`   | Travel angle of leaving characters in screen degrees.                                                   |
| `down`              | `boolean` | `false` | Sends both directions down, for falling values. Explicit angles win.                                    |
| `entranceHeight`    | `number`  | `90`    | Starting distance of arriving characters from their spot.                                               |
| `entranceOvershoot` | `number`  | `12`    | How far arriving characters overshoot their spot before settling. `0` removes the bounce.               |
| `entranceScale`     | `number`  | `1.1`   | Scale of arriving characters during the overshoot, from 0 to 2.                                         |
| `entranceBlur`      | `number`  | `0`     | Initial entrance blur in pixels; sharpens to 0 while arriving.                                          |
| `exitHeight`        | `number`  | `90`    | How far leaving characters travel.                                                                      |
| `exitScale`         | `number`  | `0.4`   | Final scale of leaving characters, from 0 to 1.5.                                                       |
| `exitBlur`          | `number`  | `4`     | Maximum exit blur in pixels. It does not scale with font size.                                          |
| `blur`              | `boolean` | `true`  | Enables entrance and exit blur; each amount is configured separately.                                   |
| `scale`             | `boolean` | `true`  | Enables scaling during both entrance and exit.                                                          |
| `preservePrefix`    | `boolean` | `true`  | Keeps matching leading characters still between values.                                                 |

The package also exports the defaults as constants, for example `DEFAULT_DURATION_MS` and `DEFAULT_STAGGER_MS`, and the `GustProps` type.

`entranceHeight` and `exitHeight` set travel distance. `entranceOvershoot` sets the entrance bounce. Distances use `100 = 1em`; blur amounts use pixels. The default animation is unchanged.

When updating older configurations, rename the old `entranceHeight` to `entranceOvershoot`, then rename `entranceOffset` to `entranceHeight`. Rename `entranceBlurCap` and `exitBlurCap` to `entranceBlur` and `exitBlur`. The offset and blur-cap names remain deprecated aliases; the new names take precedence.

## Recipes

Action label:

```tsx
const label = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save";

<button type="submit">
  <Gust value={label} />
</button>;
```

A number that moves with its direction:

```tsx
const previous = useRef(price);
const falling = price < previous.current;

useEffect(() => {
  previous.current = price;
}, [price]);

<Gust value={`$${price.toFixed(2)}`} down={falling} className="tabular-nums" />;
```

Keep a fixed unit outside Gust. Only the changing digits move:

```tsx
<span className="inline-flex items-baseline gap-1.5 tabular-nums">
  <Gust value={String(distance)} stagger={0} down />
  <span>m</span>
</span>
```

Separate settings for a button label and a numeric counter. Keep the character stagger on the label; remove it on frequently changing digits:

```tsx
const labelMotion = {
  duration: 320,
  exitDuration: 220,
  stagger: 20,
  entranceOvershoot: 8,
  entranceHeight: 100,
  exitHeight: 90,
  exitBlur: 4,
} satisfies Omit<GustProps, "value">;
const counterMotion = { ...labelMotion, stagger: 0 };

<Gust value={label} {...labelMotion} />;
<Gust value={String(percent)} {...counterMotion} />;
```

Blur is measured in pixels. At 12–14px, try 1–2px if 4px obscures the change. Keep enough travel and visible exit time to show the transition.

For a staged message, wait for the entire stagger before showing the next state. Its animation window is the larger of the entrance and exit windows: each duration plus `(animatedCharacterCount - 1) * stagger`. Hold the final text long enough to read it. For live counters, use `stagger={0}` and a steady update cadence; rapid updates can interrupt a transition.

Direction is the direction of travel, not the starting side. `enterAngle={90}` arrives from above and travels down. `enterAngle={-90}` arrives from below and travels up. Match `exitAngle` to the intended flow. If both angles are omitted, the default is upward travel. Explicit angles take precedence over `down`.

Reduced motion. Gust does not read `prefers-reduced-motion` on its own. Remove travel, scale, and blur; keep a short fade. Pause decorative loops and autoplay separately:

```tsx
const reduceMotion = usePrefersReducedMotion(); // your own media query hook

<Gust
  value={label}
  duration={reduceMotion ? 120 : undefined}
  exitDuration={reduceMotion ? 100 : undefined}
  stagger={reduceMotion ? 0 : undefined}
  entranceOvershoot={reduceMotion ? 0 : undefined}
  entranceHeight={reduceMotion ? 0 : undefined}
  exitHeight={reduceMotion ? 0 : undefined}
  scale={reduceMotion ? false : undefined}
  blur={reduceMotion ? false : undefined}
/>;
```

## How it behaves

- The first render does not animate. Only later changes to `value` animate.
- Text is split into graphemes, so emoji, accented letters and other combined characters move as one.
- Whitespace never animates.
- With `preservePrefix`, characters that match from the start of the old and new values stay still.
- The width eases to the new value in at most 240ms.
- A new value during a transition interrupts it and starts the next one.
- Gust renders one inline span (`display: inline-grid`). It takes its font, size and color from the surrounding text or from `className`.
- Screen readers read the full value from a visually hidden copy. The moving characters are hidden from assistive technology.

## Tuning

| Goal                             | Props                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| Small text (12–14px)             | `exitBlur={1}` `entranceHeight={60}` `exitHeight={60}`          |
| Falling numbers                  | `down` when the new value is lower                              |
| Snappier                         | `duration={320}` `exitDuration={280}` `stagger={12}`            |
| No bounce                        | `entranceOvershoot={0}` `entranceScale={1}`                     |
| Sideways (carousels, pagination) | `enterAngle={180}` `exitAngle={180}` for next; `0` for previous |
| Calm, slow headline              | `duration={800}` `exitDuration={700}` `stagger={40}`            |

## Common mistakes

- No stylesheet. With the npm package, a missing `@maniktherana/gust/styles.css` import shows the text more than once and breaks the layout.
- Passing a number as `value`. It must be a string, so format it first.
- Rendering Gust in a React Server Component. It uses hooks, so it must be in a Client Component.
- A parent with `overflow: hidden` or `overflow-x: auto`. Characters travel outside the line box, and the parent clips them. Remove the rule or leave enough room above and below the text for the complete travel. Mask only the part that needs masking, such as a download arrow or a progress fill.
- Changing `key` to "replay" a transition. A new key mounts a new Gust, and the first render does not animate.
- Updating `value` on every animation frame. Sample the data at a steady cadence. Tune live counters separately from labels, and inspect the interrupted transitions.
- Putting a fixed unit inside `value`. Pass only the changing number to Gust; keep `m`, `sec`, `%`, and other fixed text beside it.
- Removing stagger, blur, and travel from every label. This removes Gust's character-by-character transition. Tune each element for its size and update frequency.
- Using `tabular-nums` to fix width jumps on text. It only affects digits.

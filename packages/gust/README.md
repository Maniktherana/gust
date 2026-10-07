# Gust

Animated text transitions for React.

```sh
bun add @maniktherana/gust
```

```tsx
import { useEffect, useState } from "react";
import "@maniktherana/gust/styles.css";
import { Gust } from "@maniktherana/gust";

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

Your component owns the value and timing. Gust only animates between value changes.

The stylesheet contains Gust's structural layout and is imported explicitly by your app.

## Props

| Prop                | Type      | Default | Description                                                                           |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------- |
| `value`             | `string`  | -       | Current string. Gust animates whenever it changes.                                    |
| `duration`          | `number`  | `440`   | Incoming character duration in milliseconds.                                          |
| `exitDuration`      | `number`  | `400`   | Outgoing character duration in milliseconds.                                          |
| `stagger`           | `number`  | `20`    | Delay between neighboring characters in milliseconds.                                 |
| `down`              | `boolean` | `false` | Sends the default entrance and exit directions down. Explicit angles take precedence. |
| `enterAngle`        | `number`  | `-90`   | Incoming travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `exitAngle`         | `number`  | `-90`   | Outgoing travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `entranceOvershoot` | `number`  | `12`    | Entrance overshoot distance, where `100` equals `1em`.                                |
| `entranceHeight`    | `number`  | `90`    | Initial entry distance, where `100` equals `1em`.                                     |
| `entranceScale`     | `number`  | `1.1`   | Peak scale during entrance.                                                           |
| `entranceBlur`      | `number`  | `0`     | Initial entrance blur in pixels; sharpens to 0 while arriving.                        |
| `exitHeight`        | `number`  | `90`    | Exit travel distance, where `100` equals `1em`.                                       |
| `exitScale`         | `number`  | `0.4`   | Final scale of outgoing characters.                                                   |
| `exitBlur`          | `number`  | `4`     | Maximum exit blur in pixels. Use about `1` for 12–14px text.                          |
| `blur`              | `boolean` | `true`  | Enables entrance and exit blur; each amount is configured separately.                 |
| `scale`             | `boolean` | `true`  | Enables character scaling during entrance and exit.                                   |
| `preservePrefix`    | `boolean` | `true`  | Keeps matching leading characters still between values.                               |
| `className`         | `string`  | -       | Styles the root span. Standard span attributes are also supported.                    |

### Motion prop names

`entranceHeight` and `exitHeight` set travel distance. `entranceOvershoot` sets the entrance bounce. Distances use `100 = 1em`; blur amounts use pixels. The default animation is unchanged.

When updating older configurations, rename the old `entranceHeight` to `entranceOvershoot`, then rename `entranceOffset` to `entranceHeight`. Rename `entranceBlurCap` and `exitBlurCap` to `entranceBlur` and `exitBlur`. The offset and blur-cap names remain deprecated aliases; the new names take precedence.

## Using Gust with coding agents

Point your agent at the [agent guide](https://gust.manikrana.dev/gust.md). It covers install, every prop with its default, recipes and common mistakes in one plain-text file. An index lives at [llms.txt](https://gust.manikrana.dev/llms.txt), and the props carry JSDoc, so editors and agents see each default on hover.

[Demo and source](https://gust.manikrana.dev)

# Gust

Text that moves like air. A React text transition built on the Web Animations API.

[gust.manikrana.dev](https://gust.manikrana.dev)

## Install

npm:

```sh
bun add @maniktherana/gust
```

Or shadcn cli:

```sh
bunx shadcn@latest add https://gust.manikrana.dev/r/gust.json
```

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

Your component owns the current `value` and when it changes. Gust only animates from the previous
string to the next one.

The stylesheet contains Gust's structural layout. Import it when you use the npm package.

## Props

| Prop             | Type      | Default | Description                                                                           |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------- |
| `value`          | `string`  | -       | Current string. Gust animates whenever it changes.                                    |
| `className`      | `string`  | -       | Styles the root span. Standard span attributes are also supported.                    |
| `duration`       | `number`  | `400`   | Incoming character duration in milliseconds.                                          |
| `exitDuration`   | `number`  | `360`   | Outgoing character duration in milliseconds.                                          |
| `stagger`        | `number`  | `20`    | Delay between neighboring characters in milliseconds.                                 |
| `enterAngle`     | `number`  | `-90`   | Incoming travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `exitAngle`      | `number`  | `-90`   | Outgoing travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `entranceHeight` | `number`  | `12`    | Entrance overshoot distance.                                                          |
| `entranceScale`  | `number`  | `1.1`   | Peak scale during entrance.                                                           |
| `exitHeight`     | `number`  | `90`    | Exit distance as a percentage of line height.                                         |
| `exitScale`      | `number`  | `0.4`   | Final scale of outgoing characters.                                                   |
| `exitBlurCap`    | `number`  | `4`     | Maximum exit blur in pixels.                                                          |
| `down`           | `boolean` | `false` | Sends the default entrance and exit directions down. Explicit angles take precedence. |
| `blur`           | `boolean` | `true`  | Blurs outgoing characters during exit.                                                |
| `scale`          | `boolean` | `true`  | Enables character scaling during entrance and exit.                                   |
| `preservePrefix` | `boolean` | `true`  | Keeps matching leading characters still between values.                               |

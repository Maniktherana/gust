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

| Prop             | Type      | Default | Description                                                                           |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------- |
| `value`          | `string`  | -       | Current string. Gust animates whenever it changes.                                    |
| `duration`       | `number`  | `440`   | Incoming character duration in milliseconds.                                          |
| `exitDuration`   | `number`  | `400`   | Outgoing character duration in milliseconds.                                          |
| `stagger`        | `number`  | `20`    | Delay between neighboring characters in milliseconds.                                 |
| `down`           | `boolean` | `false` | Sends the default entrance and exit directions down. Explicit angles take precedence. |
| `enterAngle`     | `number`  | `-90`   | Incoming travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `exitAngle`      | `number`  | `-90`   | Outgoing travel angle in degrees. `-90` moves up; `90` moves down.                    |
| `entranceHeight` | `number`  | `12`    | Entrance overshoot distance.                                                          |
| `entranceOffset` | `number`  | `90`    | Initial entry distance, where `100` equals `1em`.                                     |
| `entranceScale`  | `number`  | `1.1`   | Peak scale during entrance.                                                           |
| `exitHeight`     | `number`  | `90`    | Exit distance as a percentage of line height.                                         |
| `exitScale`      | `number`  | `0.4`   | Final scale of outgoing characters.                                                   |
| `exitBlurCap`    | `number`  | `4`     | Maximum exit blur in pixels.                                                          |
| `blur`           | `boolean` | `true`  | Blurs outgoing characters during exit.                                                |
| `scale`          | `boolean` | `true`  | Enables character scaling during entrance and exit.                                   |
| `preservePrefix` | `boolean` | `true`  | Keeps matching leading characters still between values.                               |
| `className`      | `string`  | -       | Styles the root span. Standard span attributes are also supported.                    |

[Demo and source](https://gust.manikrana.dev)

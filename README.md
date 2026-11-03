# Gust

Text animations for React.

[Examples](https://gust.manikrana.dev/examples) · [Playground](https://gust.manikrana.dev/lab) · [API reference](https://gust.manikrana.dev/gust.md)

## Features

- Animates strings and numbers.
- Keeps matching text visible during changes.
- New updates can interrupt an animation in progress.
- Supports server rendering and React 18+.
- Respects reduced-motion preferences. Animated copies are hidden from screen readers.

## Limitations

- Single-line text only, without rich JSX children.
- Cross-character kerning and ligatures are not preserved.

## Installation

```sh
npm install @maniktherana/gust
```

Styles are included.

## Usage

```tsx
import { Gust } from "@maniktherana/gust";

export function Status({ text }: { text: string }) {
	return <Gust>{text}</Gust>;
}
```

The initial value renders without animation. Subsequent changes animate.

Use `as` to choose the element and pass through its HTML attributes:

```tsx
<Gust as="p" className="status" aria-live="polite">
	{status}
</Gust>
```

Add a live region only when changes need to be announced.

## API

| Prop             | Type                                  | Default        | Description                                                                                                     |
| ---------------- | ------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `children`       | `string \| number`                    | Required       | The text to display.                                                                                            |
| `as`             | `GustTag`                             | `"span"`       | The text element to render.                                                                                     |
| `animated`       | `boolean`                             | `true`         | Set to `false` for immediate updates.                                                                           |
| `direction`      | `"up" \| "down" \| "left" \| "right"` | —              | Overrides numeric trend and motion angles.                                                                      |
| `trend`          | `"auto" \| "up" \| "down"`            | `"auto"`       | In auto mode, increasing numbers move up and decreasing numbers move down. Pass numbers, not formatted strings. |
| `preservePrefix` | `boolean`                             | `true`         | Keeps matching text at both ends. Set to `false` to animate the whole value.                                    |
| `motion`         | `GustMotionOptions`                   | Default motion | Custom animation settings.                                                                                      |
| `nonce`          | `string`                              | —              | CSP nonce for the included styles.                                                                              |

`className`, `style`, HTML attributes, and events apply to the outer element. A forwarded `ref` points to that element.

### Custom motion

```tsx
import { Gust, type GustMotionOptions } from "@maniktherana/gust";

const motion = {
	duration: 320,
	exitDuration: 240,
} satisfies GustMotionOptions;

<Gust motion={motion}>{text}</Gust>;
```

Entry and exit each default to 440ms. Set their durations separately. Try the other motion settings in [Engine](https://gust.manikrana.dev/engine), or see the [API reference](https://gust.manikrana.dev/gust.md).

## Development

```sh
bun install
bun run dev
bun run test
bun run typecheck
bun run build
```

After building, use `bun run --cwd apps/site preview`. The server build targets Bun.

## Why?

I like the text animations in [NumericText](https://github.com/yokaiqq/numeric-text), [Calligraph](https://github.com/raphaelsalaja/calligraph), and [Torph](https://github.com/lochie/torph). Gust is my take on that kind of motion.

Gust keeps matching text at both ends and brings in the changed characters with a small spring. I kept the stagger short and made the animation interruptible, since a counter might change again before the previous update finishes.

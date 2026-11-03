# Gust API reference

Gust animates single-line text changes in React using the Web Animations API.

## Install

```sh
npm install @maniktherana/gust
```

Styles are included.

## Usage

```tsx
import { Gust } from "@maniktherana/gust";

<Gust>{status}</Gust>

<Gust as="p" className="status" style={{ fontWeight: 600 }}>
  {status}
</Gust>

<button onClick={copy}>
  <Gust>{copied ? "Copied" : "Copy"}</Gust>
</button>
```

## Props

| Prop                 | Description                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `children`           | A string or number. No rich JSX or `dangerouslySetInnerHTML`.                                                                      |
| `as`                 | Defaults to `span`. Supports `span`, `p`, `h1`–`h6`, `strong`, `em`, `small`, `b`, `i`, `s`, `mark`, and `label`.                  |
| `className`, `style` | Applied to the outer element.                                                                                                      |
| HTML attributes      | Events, `aria-*`, and `data-*` are passed to the outer element.                                                                    |
| `ref`                | Points to the outer element.                                                                                                       |
| `animated`           | Defaults to `true`. Set to `false` for immediate updates. Reduced motion and hidden documents also disable animation.              |
| `direction`          | Optional `up`, `down`, `left`, or `right`. Overrides motion angles and numeric trend.                                              |
| `trend`              | `auto` (default), `up`, or `down`. Auto compares raw finite numbers, not formatted strings. Explicit motion angles override trend. |
| `preservePrefix`     | Preserves matching text at both ends by default. Set to `false` to replace the entire value. Overrides `motion.preserveMatching`.  |
| `motion`             | Optional `GustMotionOptions`. All fields are optional.                                                                             |
| `nonce`              | Applies a CSP nonce to the included style element.                                                                                 |

Without `direction` or explicit motion angles, `trend="auto"` moves increasing numbers up and decreasing numbers down. Other changes default to up. For formatted values, choose direction from the underlying numbers:

```tsx
<Gust direction={amount >= previousAmount ? "up" : "down"}>
  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}
</Gust>
```

## Motion settings

```tsx
import { Gust, type GustMotionOptions } from "@maniktherana/gust";

const motion = {
  duration: 440,
  entranceBlur: 0.1,
  blurUnit: "em",
} satisfies GustMotionOptions;

<Gust motion={motion}>{text}</Gust>;
```

Entry and exit each default to 440ms, with a spring entrance and a 30% stagger spread. Set `duration` and `exitDuration` separately; changing one does not change the other.

`GustMotionOptions` lets you adjust timing, direction, stagger, travel, scale, opacity, rotation, blur, and easing. Times are milliseconds. Travel distances are hundredths of an em (`100` means `1em`); blur uses `px` or `em`. Scale values are multipliers, and angles are degrees: `0` right, `90` down, `-90` up, and `180` left.

You can try motion settings in [Engine](https://gust.manikrana.dev/engine).

## Limits and accessibility

- React only. Single-line plain text, not JSX. `as="p"` does not enable wrapping.
- Cross-character kerning and ligatures are not preserved.

[Examples](https://gust.manikrana.dev/examples)

## Why?

I like the text animations in [NumericText](https://github.com/yokaiqq/numeric-text), [Calligraph](https://github.com/raphaelsalaja/calligraph), and [Torph](https://github.com/lochie/torph). Gust is my take on that kind of motion.

Gust keeps matching text at both ends and brings in the changed characters with a small spring. I kept the stagger short and made the animation interruptible, since a counter might change again before the previous update finishes.

# Gust

Text that moves like air. Gust is a React text transition built on the browser Web Animations API. It adds no runtime packages to a consumer project: React is its only peer.

## Install

Install from the public GitHub registry with the shadcn CLI:

```sh
bunx shadcn@latest add maniktherana/gust/gust
```

The CLI reads the consumer's `components.json`, installs the source under its configured `aliases.ui` directory, and merges Gust's structural CSS into its configured CSS file. A default project can then import:

```tsx
import { Gust } from "@/components/ui/gust";

export function SaveButton({ saved }: { saved: boolean }) {
  return <Gust text={saved ? "Saved" : "Save"} />;
}
```

Pin a release when reproducibility matters:

```sh
bunx shadcn@latest add maniktherana/gust/gust#v0.1.0
```

## Styling

Gust ships layout CSS only. Typography, color, spacing, and other inherited text styles stay under consumer control.

Tailwind classes work through the standard `className` prop:

```tsx
<Gust text={status} className="text-sm font-semibold tracking-tight text-emerald-600" />
```

Plain CSS works the same way:

```tsx
<Gust text={status} className="deployment-status" />
```

```css
.deployment-status {
  color: seagreen;
  font:
    600 0.875rem/1.25rem system-ui,
    sans-serif;
  letter-spacing: -0.01em;
}
```

Standard span props, including `style`, `aria-*`, `data-*`, and event handlers, pass through to the root. Gust itself does not render a React `style` attribute; transient positions and transforms are owned by Web Animations.

## Modes

Use `text` for a controlled value whose every change should animate:

```tsx
<Gust text={copied ? "Copied" : "Copy"} align="start" />
```

Use `words` for a self-running cycle, or combine it with `index` to control the cycle externally:

```tsx
<Gust words={["Queued", "Building", "Live"]} interval={1800} />
<Gust words={["Back", "Next"]} index={step} />
```

Gust segments grapheme clusters, preserves shared prefixes, renders the first value without an entrance flash, and falls back to short opacity fades when reduced motion is requested.

## Repository

- `packages/gust` is the only canonical component source.
- `packages/registry` turns that source and `gust.css` into the shadcn registry schema.
- `registry.json` is the public GitHub registry manifest.
- `apps/site` is the documentation, demos, and Lab.
- `tests/fixtures/consumer` proves that shadcn honors a custom `aliases.ui` and merges CSS into the configured file.

## Development

```sh
bun install
bun run dev
```

Useful checks:

```sh
bun run registry:build  # generate registry.json and apps/site/public/r/gust.json
bun run registry:check  # install into a clean fixture and typecheck the result
bun run test:browser    # run Chrome motion and reduced-motion checks
bun run verify          # the complete release gate
```

See [docs/releasing.md](docs/releasing.md) for the release flow.

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
import { Gust } from "@maniktherana/gust";
import "@maniktherana/gust/styles.css";

<Gust text={saved ? "Saved" : "Save"} />;
<Gust words={["Queued", "Building", "Live"]} />;
```

The stylesheet contains Gust's structural layout. Import it when you use the npm package.

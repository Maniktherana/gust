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

<Gust text={saved ? "Saved" : "Save"} />;
<Gust words={["Queued", "Building", "Live"]} />;
```

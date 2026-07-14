# Gust

Text that moves like air. A React text transition built on the Web Animations API.

[gust.manikrana.dev](https://gust.manikrana.dev)

## Install

Package:

```sh
bun add @maniktherana/gust
```

Or copy the source into your project:

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

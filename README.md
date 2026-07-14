# Gust

Text that moves like air. A React text transition built on the Web Animations API.

[gust.manikrana.dev](https://gust.manikrana.dev)

## Install

```sh
bunx shadcn@latest add https://gust.manikrana.dev/r/gust.json
```

## Usage

```tsx
import { Gust } from "@/components/ui/gust";

<Gust text={saved ? "Saved" : "Save"} />;
<Gust words={["Queued", "Building", "Live"]} />;
```

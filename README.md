# Gust

Text that moves like air. A React text transition built on the Web Animations API.

[Demo and docs](https://gust.manikrana.dev)

## Install

```sh
bunx shadcn@latest add @maniktherana/gust
```

## Usage

```tsx
import { Gust } from "@/components/ui/gust";

<Gust text={saved ? "Saved" : "Save"} />;
<Gust words={["Queued", "Building", "Live"]} />;
```

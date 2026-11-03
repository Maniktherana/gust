import { createServerFn } from "@tanstack/react-start";
import { highlightCode } from "@/lib/highlight-code";

export const getUsageSource = createServerFn({ method: "GET" }).handler(async () => {
  const code = `import { Gust } from "@maniktherana/gust";

<Gust>{text}</Gust>`;

  return { code, html: await highlightCode(code) };
});

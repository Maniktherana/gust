import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const packageRoot = new URL("../", import.meta.url);

test("the npm build keeps the client directive", async () => {
  const [config, component] = await Promise.all([
    readFile(new URL("tsup.config.ts", packageRoot), "utf8"),
    readFile(new URL("src/gust.tsx", packageRoot), "utf8"),
  ]);

  expect(component.startsWith('"use client";')).toBe(true);
  expect(config).toContain(`banner: { js: '"use client";' }`);
  // Rollup tree-shaking would strip the banner again.
  expect(config).toContain("treeshake: false");
});

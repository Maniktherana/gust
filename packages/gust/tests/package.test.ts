import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const packageRoot = new URL("../", import.meta.url);

test("the distributed component has no runtime package dependencies", async () => {
  const manifest = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8"));
  const component = await readFile(new URL("src/gust.tsx", packageRoot), "utf8");

  expect(manifest.dependencies).toEqual({});
  expect(manifest.peerDependencies).toEqual({ react: ">=18" });
  expect(component).not.toContain("style=");
  expect(component).not.toContain("cn(");
  expect(component).not.toContain("@/");
});

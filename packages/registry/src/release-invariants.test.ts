import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createRegistry, registryHomepage, registryNamespace, registryUrl } from "./build-registry";

const root = resolve(import.meta.dir, "../../..");

test("release metadata stays synchronized", async () => {
  const [rootManifest, componentManifest, siteManifest, registryManifest, license, registry] =
    await Promise.all([
      readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "packages/gust/package.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "apps/site/package.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "packages/registry/package.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "LICENSE"), "utf8"),
      createRegistry(),
    ]);
  const item = registry.items[0];

  if (!item) throw new Error("The Gust registry item is missing.");

  expect(rootManifest.version).toBe(componentManifest.version);
  expect(rootManifest.license).toBe("MIT");
  expect(componentManifest.license).toBe("MIT");
  expect(license).toStartWith("MIT License");
  expect(registry.homepage).toBe(registryHomepage);
  expect(registryNamespace).toBe("@maniktherana");
  expect(registryUrl).toBe("https://gust.manikrana.dev/r/{name}.json");
  expect(siteManifest.scripts.prebuild).toBe("bun run --cwd ../../packages/registry build:static");
  expect(registryManifest.scripts["build:static"]).toBe("bun src/build-static.ts");
  expect(componentManifest.private).toBe(true);
  expect(componentManifest.exports["./styles.css"]).toBe("./src/gust.css");
  expect(item.meta.version).toBe(componentManifest.version);
  expect(item.dependencies).toEqual([]);
  expect(item.registryDependencies).toEqual([]);
  expect(item.files.length).toBeGreaterThan(0);
  expect(
    item.files.every(
      ({ path, target }) => path.startsWith("packages/gust/src/") && target.startsWith("@ui/gust/"),
    ),
  ).toBe(true);
});

import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createRegistry, registryHomepage, registryUrl } from "./build-registry";

const root = resolve(import.meta.dir, "../../..");

test("release metadata stays synchronized", async () => {
  const [rootManifest, componentManifest, siteManifest, license, registry] = await Promise.all([
    readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "packages/gust/package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "apps/site/package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "LICENSE"), "utf8"),
    createRegistry(),
  ]);
  const item = registry.items[0];

  if (!item) throw new Error("The Gust registry item is missing.");

  expect(rootManifest.license).toBe("MIT");
  expect(componentManifest.license).toBe("MIT");
  expect(license).toStartWith("MIT License");
  expect(registry.homepage).toBe(registryHomepage);
  expect(registryUrl).toBe("https://gust.manikrana.dev/r/{name}.json");
  expect(siteManifest.scripts.prebuild).toBe("bun registry/build-static.ts");
  expect(componentManifest.name).toBe("@maniktherana/gust");
  expect(componentManifest.private).toBeUndefined();
  expect(componentManifest.exports["./styles.css"]).toBe("./src/gust.css");
  expect(item.meta.version).toBe(componentManifest.version);
  expect(item.dependencies).toEqual([]);
  expect(item.registryDependencies).toEqual([]);
  expect("css" in item).toBeTrue();
  expect(item.files.length).toBeGreaterThan(0);
  expect(
    item.files.every(
      ({ path, target }) => path.startsWith("packages/gust/src/") && target.startsWith("@ui/gust/"),
    ),
  ).toBe(true);
});

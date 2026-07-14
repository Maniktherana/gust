import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import postcss, { type ChildNode, type Container } from "postcss";

interface CssTree {
  [key: string]: string | CssTree;
}

const root = resolve(import.meta.dir, "../../..");
const componentRoot = resolve(root, "packages/gust");
const registryPath = resolve(root, "registry.json");
export const registryHomepage = "https://gust.manikrana.dev";
export const registryUrl = `${registryHomepage}/r/{name}.json`;
const sourceFiles = [
  "index.ts",
  "gust.tsx",
  "characters.ts",
  "config.ts",
  "easing.ts",
  "hooks.ts",
  "keyframes.ts",
  "measure.ts",
] as const;

function addUnique(target: CssTree, key: string, value: string | CssTree) {
  if (key in target) throw new Error(`Duplicate CSS key: ${key}`);
  target[key] = value;
}

function cssContainerToObject(container: Container<ChildNode>) {
  const result: CssTree = {};

  container.each((node) => {
    if (node.type === "comment") return;

    if (node.type === "decl") {
      addUnique(result, node.prop, node.value);
      return;
    }

    if (node.type === "rule") {
      addUnique(result, node.selector, cssContainerToObject(node));
      return;
    }

    if (node.type === "atrule") {
      const key = `@${node.name}${node.params ? ` ${node.params}` : ""}`;
      addUnique(result, key, node.nodes ? cssContainerToObject(node) : "");
      return;
    }

    throw new Error("Unsupported CSS node.");
  });

  return result;
}

export function cssToRegistryObject(css: string) {
  return cssContainerToObject(postcss.parse(css));
}

export async function createRegistry() {
  const manifest = JSON.parse(await readFile(resolve(componentRoot, "package.json"), "utf8")) as {
    version: string;
  };
  const css = await readFile(resolve(componentRoot, "src/gust.css"), "utf8");

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "gust",
    homepage: registryHomepage,
    items: [
      {
        name: "gust",
        type: "registry:ui",
        title: "Gust",
        description: "A React text transition built on the Web Animations API",
        dependencies: [],
        registryDependencies: [],
        files: sourceFiles.map((file) => ({
          path: `packages/gust/src/${file}`,
          target: `@ui/gust/${file}`,
          type: "registry:ui",
        })),
        css: cssToRegistryObject(css),
        meta: { version: manifest.version },
      },
    ],
  };
}

if (import.meta.main) {
  const expected = `${JSON.stringify(await createRegistry(), null, "\t")}\n`;

  if (process.argv.includes("--check")) {
    const current = await readFile(registryPath, "utf8").catch(() => "");

    if (current !== expected) {
      console.error("registry.json is stale. Run `bun run registry:build`.");
      process.exit(1);
    }
  } else {
    await writeFile(registryPath, expected);
  }
}

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../../..");
const fixtureTemplate = resolve(root, "tests/fixtures/consumer");
const fixture = resolve(root, "packages/gust/.tmp/registry-consumer");
const registryItem = resolve(root, "apps/site/public/r/gust.json");

await rm(fixture, { force: true, recursive: true });
await mkdir(fixture, { recursive: true });
await cp(fixtureTemplate, fixture, { recursive: true });

const command = Bun.spawn(
  [resolve(root, "node_modules/.bin/shadcn"), "add", registryItem, "--yes", "--overwrite"],
  {
    cwd: fixture,
    stderr: "inherit",
    stdout: "inherit",
  },
);

if ((await command.exited) !== 0) process.exit(1);

const expectedFiles = [
  "index.ts",
  "gust.tsx",
  "characters.ts",
  "config.ts",
  "easing.ts",
  "hooks.ts",
  "keyframes.ts",
  "measure.ts",
];

await Promise.all(
  expectedFiles.map((file) => readFile(resolve(fixture, "src/custom/ui/gust", file), "utf8")),
);

const stylesheet = await readFile(resolve(fixture, "src/styles.css"), "utf8");

if (!stylesheet.includes('[data-slot="gust"]')) {
  throw new Error("Gust CSS was not merged into the consumer stylesheet.");
}

await writeFile(
  resolve(fixture, "src/consumer.tsx"),
  `import { Gust } from "@/custom/ui/gust";\n\nexport const Example = () => <Gust className="text-2xl" text="Ready" />;\n`,
);

const typecheck = Bun.spawn([resolve(root, "node_modules/.bin/tsc"), "--noEmit"], {
  cwd: fixture,
  stderr: "inherit",
  stdout: "inherit",
});

if ((await typecheck.exited) !== 0) process.exit(1);

console.log("Registry smoke test passed: custom UI alias, CSS merge, and consumer typecheck.");

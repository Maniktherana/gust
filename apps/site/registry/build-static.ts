import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../../..");
const command = Bun.spawn(
  [
    resolve(root, "apps/site/node_modules/.bin/shadcn"),
    "build",
    "registry.json",
    "--output",
    "apps/site/public/r",
  ],
  {
    cwd: root,
    stderr: "inherit",
    stdout: "inherit",
  },
);

if ((await command.exited) !== 0) process.exit(1);

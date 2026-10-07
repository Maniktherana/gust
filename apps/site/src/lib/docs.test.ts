import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { defaultMotion } from "./gust-motion";

const root = new URL("../../../../", import.meta.url);
const documents = ["apps/site/public/gust.md", "README.md", "packages/gust/README.md"];

// Every documented default must match the one the component actually uses.
const documented = {
  blur: defaultMotion.blur,
  down: false,
  duration: defaultMotion.duration,
  enterAngle: defaultMotion.enterAngle,
  entranceBlur: defaultMotion.entranceBlur,
  entranceOvershoot: defaultMotion.entranceOvershoot,
  entranceHeight: defaultMotion.entranceHeight,
  entranceScale: defaultMotion.entranceScale,
  exitAngle: defaultMotion.exitAngle,
  exitBlur: defaultMotion.exitBlur,
  exitDuration: defaultMotion.exitDuration,
  exitHeight: defaultMotion.exitHeight,
  exitScale: defaultMotion.exitScale,
  preservePrefix: defaultMotion.preservePrefix,
  scale: defaultMotion.scale,
  stagger: defaultMotion.stagger,
};

for (const document of documents) {
  test(`${document} lists every prop with its current default`, async () => {
    const text = await readFile(new URL(document, root), "utf8");

    for (const [prop, value] of Object.entries(documented)) {
      expect(text, `${prop} in ${document}`).toMatch(
        new RegExp(`\\| \`${prop}\`\\s*\\|[^|]*\\|\\s*\`${String(value)}\`\\s*\\|`),
      );
    }
  });
}

import { expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";

const packageRoot = new URL("../", import.meta.url);

test("the distributed component has no runtime package dependencies", async () => {
  const manifest = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8"));
  const sourceDirectory = new URL("src/", packageRoot);
  const sourceFiles = (await readdir(sourceDirectory)).filter((file) => /\.tsx?$/.test(file));
  const sources = await Promise.all(
    sourceFiles.map(async (file) => ({
      file,
      source: await readFile(new URL(file, sourceDirectory), "utf8"),
    })),
  );
  const publicEntry = await readFile(new URL("src/index.ts", packageRoot), "utf8");

  expect(manifest.name).toBe("@maniktherana/gust");
  expect(manifest.private).toBeUndefined();
  expect(manifest.files).toEqual(["dist", "src/gust.css"]);
  expect(manifest.exports["."].import).toBe("./dist/index.js");
  expect(manifest.exports["."].types).toBe("./dist/index.d.ts");
  expect(manifest.exports["./styles.css"]).toBe("./src/gust.css");
  expect(manifest.dependencies).toEqual({});
  expect(manifest.peerDependencies).toEqual({ react: ">=18" });
  expect(publicEntry).not.toContain("defaultGustWords");

  for (const { file, source } of sources) {
    expect(source, `${file} must not depend on cn`).not.toContain("cn(");
    expect(source, `${file} must not use app aliases`).not.toContain("@/");

    const imports = Array.from(
      source.matchAll(/\b(?:from|import)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g),
      (match) => match[1],
    );
    expect(
      imports.every((specifier) => specifier === "react" || specifier.startsWith(".")),
      `${file} imports only React or local modules`,
    ).toBe(true);
  }
});

test("the structural stylesheet is framework-independent", async () => {
  const css = await readFile(new URL("src/gust.css", packageRoot), "utf8");

  expect(css).not.toContain("@apply");
  expect(css).not.toContain("@import");
  expect(css).not.toContain("@tailwind");
  expect(css).toContain("white-space: pre");
});

test("looping character animations do not accumulate lifecycle listeners", async () => {
  const hooks = await readFile(new URL("src/hooks.ts", packageRoot), "utf8");
  const enterStart = hooks.indexOf("export function useEnterAnimations");
  const exitStart = hooks.indexOf("export function useExitAnimations");
  const rootStart = hooks.indexOf("export function useRootWidthMorph");
  const enterHook = hooks.slice(enterStart, exitStart);
  const exitHook = hooks.slice(exitStart, rootStart);

  expect(enterStart).toBeGreaterThan(-1);
  expect(exitStart).toBeGreaterThan(enterStart);
  expect(rootStart).toBeGreaterThan(exitStart);
  expect(enterHook).not.toContain(".onfinish");
  expect(enterHook).not.toContain(".oncancel");
  expect(exitHook).not.toContain(".onfinish");
  expect(exitHook).not.toContain(".oncancel");
});

test("completed character animations release their effects", async () => {
  const hooks = await readFile(new URL("src/hooks.ts", packageRoot), "utf8");
  const component = await readFile(new URL("src/gust.tsx", packageRoot), "utf8");
  const css = await readFile(new URL("src/gust.css", packageRoot), "utf8");
  const enterStart = hooks.indexOf("export function useEnterAnimations");
  const exitStart = hooks.indexOf("export function useExitAnimations");
  const rootStart = hooks.indexOf("export function useRootWidthMorph");
  const enterHook = hooks.slice(enterStart, exitStart);
  const exitHook = hooks.slice(exitStart, rootStart);

  expect(enterHook).toContain('fill: "backwards"');
  expect(exitHook).toContain('fill: "backwards"');
  expect(enterHook).not.toContain('fill: "both"');
  expect(exitHook).not.toContain('fill: "both"');
  expect(enterHook).toContain("ownerDocument.hidden");
  expect(exitHook).toContain("ownerDocument.hidden");
  expect(component).not.toContain('data-gust-animating="true"');
  // Only the root keeps a compositing boundary. Finished characters must not retain a layer
  // each, which grows memory usage in counters and other continuously changing text.
  const characterStyles = css.slice(css.indexOf(':where([data-gust-part="sizer"]'));
  expect(characterStyles).not.toContain("will-change");
  expect(css).toContain(':where([data-gust-part="glyph"]) {\n    --gust-opacity: 1;');
  expect(css).toContain(':where([data-gust-part="exit"]) {\n    --gust-opacity: 0;');
});

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

  expect(manifest.name).toBe("@maniktherana/gust");
  expect(manifest.private).toBeUndefined();
  expect(manifest.files).toEqual(["dist", "src/gust.css"]);
  expect(manifest.exports["."].import).toBe("./dist/index.js");
  expect(manifest.exports["."].types).toBe("./dist/index.d.ts");
  expect(manifest.exports["./styles.css"]).toBe("./src/gust.css");
  expect(manifest.dependencies).toEqual({});
  expect(manifest.peerDependencies).toEqual({ react: ">=18" });

  for (const { file, source } of sources) {
    expect(source, `${file} must not render inline styles`).not.toMatch(/\bstyle\s*=/);
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

test("the structural stylesheet is framework-independent and preserves whitespace", async () => {
  const css = await readFile(new URL("src/gust.css", packageRoot), "utf8");

  expect(css).not.toContain("@apply");
  expect(css).not.toContain("@import");
  expect(css).not.toContain("@tailwind");
  expect(css).toContain("white-space: pre");
});

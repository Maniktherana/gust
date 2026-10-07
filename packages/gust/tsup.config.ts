import { defineConfig } from "tsup";

export default defineConfig({
  // Bundling drops the source's module-level "use client". Restore it so Next.js
  // App Router treats the hook-based component as a Client Component.
  banner: { js: '"use client";' },
  clean: true,
  dts: true,
  entry: { index: "src/index.ts" },
  external: ["react", "react/jsx-runtime"],
  format: ["esm"],
  minify: false,
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  target: "es2022",
  // Rollup tree-shaking strips the directive above; esbuild already drops dead code.
  treeshake: false,
});

import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: { index: "src/package.ts" },
  external: ["react", "react/jsx-runtime"],
  format: ["esm"],
  injectStyle: true,
  minify: false,
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  target: "es2022",
  treeshake: true,
});

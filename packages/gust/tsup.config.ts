import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  external: ["react", "react/jsx-runtime"],
  format: ["esm"],
  minify: false,
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  target: "es2022",
  treeshake: true,
});

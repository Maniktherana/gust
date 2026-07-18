import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  resolve: {
    alias:
      command === "build"
        ? [
            {
              find: /^dialkit$/,
              replacement: fileURLToPath(
                new URL("./src/lib/dialkit-production.ts", import.meta.url),
              ),
            },
            {
              find: /^dialkit\/styles\.css$/,
              replacement: fileURLToPath(
                new URL("./src/lib/dialkit-production.css", import.meta.url),
              ),
            },
          ]
        : undefined,
    tsconfigPaths: true,
  },
  server: {
    port: 3002,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: process.env.VERCEL ? "vercel" : "bun",
    }),
    viteReact(),
  ],
}));

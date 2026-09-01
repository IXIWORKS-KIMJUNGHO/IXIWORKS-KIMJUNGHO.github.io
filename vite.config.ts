import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: false,
  build: {
    emptyOutDir: true,
    outDir: "assets/generated",
    rollupOptions: {
      input: resolve(import.meta.dirname, "src/entries/site.ts"),
      output: {
        entryFileNames: "site.js",
        assetFileNames: "site[extname]",
        format: "es",
      },
    },
  },
});

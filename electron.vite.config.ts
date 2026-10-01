import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const fonts = resolve("node_modules/@excalidraw/excalidraw/dist/prod/fonts");
function fontsPlugin() {
  return {
    name: "folio-fonts",
    configResolved() {
      if (!existsSync(fonts)) throw new Error("Excalidraw 字体目录不存在");
      mkdirSync(resolve("public/excalidraw-assets"), { recursive: true });
      cpSync(fonts, resolve("public/excalidraw-assets/fonts"), { recursive: true });
    },
  };
}
// The upstream layout registry retains a comment naming the excluded package.
function vendorCommentsPlugin() {
  return {
    name: "folio-vendor-comments",
    transform(code: string, id: string) {
      if (!id.includes("/mermaid/dist/")) return null;
      return code.replace(/^.*\/\/ elkjs is .*\n/gm, "");
    },
  };
}
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()], build: { lib: { entry: "electron/main/index.ts" } } },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { lib: { entry: "electron/preload/index.ts", formats: ["cjs"] } },
  },
  renderer: {
    root: resolve("."),
    resolve: {
      alias: [{ find: /^elkjs(?:\/.*)?$/, replacement: resolve("src/lib/vendor/elk-stub.ts") }],
    },
    plugins: [react(), fontsPlugin(), vendorCommentsPlugin()],
    build: { chunkSizeWarningLimit: 2000, rollupOptions: { input: resolve("index.html") } },
    server: { port: 1420, strictPort: true },
  },
});

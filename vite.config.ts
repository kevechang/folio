import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const fonts = resolve("node_modules/@excalidraw/excalidraw/dist/prod/fonts");
function fontsPlugin() {
  return {
    name: "folio-fonts",
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (
            req: unknown,
            res: { statusCode: number; end: () => void },
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use("/excalidraw-assets/fonts", (_req, _res, next) => next());
    },
    configResolved() {
      if (!existsSync(fonts)) throw new Error("Excalidraw 字体目录不存在");
      mkdirSync(resolve("public/excalidraw-assets"), { recursive: true });
      cpSync(fonts, resolve("public/excalidraw-assets/fonts"), { recursive: true });
    },
    writeBundle() {
      mkdirSync(resolve("dist/excalidraw-assets"), { recursive: true });
      cpSync(fonts, resolve("dist/excalidraw-assets/fonts"), { recursive: true });
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
  resolve: {
    alias: [{ find: /^elkjs(?:\/.*)?$/, replacement: resolve("src/lib/vendor/elk-stub.ts") }],
  },
  // Excalidraw 0.18.1 ships as a large lazy-loaded upstream chunk.
  build: { chunkSizeWarningLimit: 2000 },
  test: { server: { deps: { inline: ["@excalidraw/excalidraw", "open-color"] } } },
  plugins: [react(), fontsPlugin(), vendorCommentsPlugin()],
  server: { port: 1420, strictPort: true },
  clearScreen: false,
});

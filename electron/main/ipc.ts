import {
  ClipboardItem,
  clipboard,
  dialog,
  ipcMain,
  nativeImage,
  shell,
  type BrowserWindow,
} from "electron";
import { fileStat, listDocuments, readSceneFile, renameSceneFile, writeFileAtomic } from "./ipc-fs";
import { installMenu, type MenuNode } from "./menu";
import { currentTheme, installTheme } from "./theme";
import type { createOpenFiles } from "./open-files";
import type { installLifecycle } from "./lifecycle";
import {
  allowDocumentAssets,
  allowFolderAssets,
  authorizedAssetRoots,
  removeFolderAssets,
} from "./asset-roots";
import { resolveAuthorizedAssetPath } from "./asset-path";
import { uploadImage, type UploadConfig } from "./upload";
import { join } from "node:path";
import { exportPdf } from "./pdf";

type OpenFiles = ReturnType<typeof createOpenFiles>;
type Lifecycle = ReturnType<typeof installLifecycle>;

export function installIpc(window: BrowserWindow, openFiles: OpenFiles, lifecycle: Lifecycle) {
  const setTheme = installTheme(window);
  const approvedPdfPaths = new Set<string>();
  const handle = <T extends unknown[]>(
    channel: string,
    handler: (...args: T) => unknown | Promise<unknown>,
  ) => {
    ipcMain.handle(channel, async (event, ...args) => {
      if (event.senderFrame !== window.webContents.mainFrame) throw new Error("Invalid frame");
      try {
        return { ok: true, value: await handler(...(args as T)) };
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "Io";
        return {
          ok: false,
          error: {
            code,
            message:
              error instanceof Error
                ? error.message
                : typeof error === "object" && error !== null && "message" in error
                  ? String(error.message)
                  : String(error),
          },
        };
      }
    });
  };
  handle("file:read", readSceneFile);
  handle("file:write", writeFileAtomic);
  handle("file:stat", fileStat);
  handle("file:list", listDocuments);
  handle("asset:read", async (path: string) => {
    const real = await resolveAuthorizedAssetPath(path, authorizedAssetRoots());
    return real ? readSceneFile(real) : null;
  });
  handle("asset:document", (path: string) => allowDocumentAssets(path));
  handle("asset:folder", (path: string) => allowFolderAssets(path));
  handle("asset:remove-folder", (path: string) => removeFolderAssets(path));
  handle("file:rename", renameSceneFile);
  handle("upload:image", (bytes: Uint8Array, ext: string, config: UploadConfig) =>
    uploadImage(bytes, ext, config),
  );
  handle("dialog:upic", async () => {
    const path = (
      await dialog.showOpenDialog(window, {
        defaultPath: "/Applications",
        properties: ["openFile"],
        filters: [{ name: "uPic", extensions: ["app"] }],
      })
    ).filePaths[0];
    return path ? (path.endsWith(".app") ? join(path, "Contents/MacOS/uPic") : path) : null;
  });
  handle("dialog:open", async (defaultPath?: string) => {
    const path =
      (
        await dialog.showOpenDialog(window, {
          ...(defaultPath ? { defaultPath } : {}),
          properties: ["openFile"],
          filters: [
            {
              name: "所有文档",
              extensions: ["excalidraw", "json", "png", "svg", "md", "markdown"],
            },
            { name: "Markdown 文稿", extensions: ["md", "markdown"] },
            { name: "Excalidraw 画布", extensions: ["excalidraw", "json", "png", "svg"] },
          ],
        })
      ).filePaths[0] ?? null;
    if (path) allowDocumentAssets(path);
    return path;
  });
  handle(
    "dialog:save",
    async (name: string, ext: string, filterName: string = "Excalidraw 画布") => {
      const path =
        (
          await dialog.showSaveDialog(window, {
            defaultPath: `${name}.${ext}`,
            filters: [{ name: filterName, extensions: [ext] }],
          })
        ).filePath ?? null;
      if (ext === "pdf" && path) approvedPdfPaths.add(path);
      return path;
    },
  );
  handle("dialog:folder", async () => {
    const path =
      (
        await dialog.showOpenDialog(window, {
          properties: ["openDirectory"],
        })
      ).filePaths[0] ?? null;
    if (path) allowFolderAssets(path);
    return path;
  });
  handle("shell:reveal", (path: string) => shell.showItemInFolder(path));
  handle("shell:external", (url: string) => {
    if (!/^(https?:|mailto:)/i.test(url)) throw new Error("Unsupported URL");
    return shell.openExternal(url);
  });
  handle("clipboard:png", (bytes: Uint8Array) =>
    clipboard.write([
      new ClipboardItem({
        "image/png": new Blob([
          Uint8Array.from(nativeImage.createFromBuffer(Buffer.from(bytes)).toPNG())
            .buffer as ArrayBuffer,
        ]),
      }),
    ]),
  );
  handle("clipboard:html", (html: string, text: string) =>
    clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]),
  );
  handle("export:pdf", (html: string, targetPath: string) => {
    if (!approvedPdfPaths.delete(targetPath)) throw new Error("PDF 路径未获保存对话框授权");
    return exportPdf(html, targetPath);
  });
  handle("open:take", () => openFiles.takePending());
  handle("exit:complete", () => lifecycle.complete());
  handle("exit:request", () => lifecycle.request());
  handle("theme:set", setTheme);
  handle("theme:get", currentTheme);
  handle("menu:set", (model: MenuNode[]) => installMenu(window, model));
}

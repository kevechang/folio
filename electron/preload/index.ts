import { contextBridge, ipcRenderer, webUtils } from "electron";

async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as
    { ok: true; value: T } | { ok: false; error: { code: string; message: string } };
  if (!result.ok) throw result.error;
  return result.value;
}

function listen<T>(channel: string, callback: (value: T) => void) {
  const handler = (_event: Electron.IpcRendererEvent, value: T) => callback(value);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

contextBridge.exposeInMainWorld("folio", {
  openFileDialog: (defaultPath?: string) => call<string | null>("dialog:open", defaultPath),
  saveFileDialog: (name: string, ext: string, filterName?: string) =>
    call<string | null>("dialog:save", name, ext, filterName),
  exportPdf: (html: string, targetPath: string) => call<void>("export:pdf", html, targetPath),
  writeHtmlClipboard: (html: string, text: string) => call<void>("clipboard:html", html, text),
  pickFolder: () => call<string | null>("dialog:folder"),
  pickUpic: () => call<string | null>("dialog:upic"),
  uploadImage: (
    bytes: Uint8Array,
    ext: string,
    config: { storage: "picgo"; url: string } | { storage: "upic"; path: string },
  ) => call<string>("upload:image", bytes, ext, config),
  authorizeDocument: (path: string) => call<void>("asset:document", path),
  authorizeFolder: (path: string) => call<void>("asset:folder", path),
  removeFolderAuthorization: (path: string) => call<void>("asset:remove-folder", path),
  readFile: (path: string) => call<Uint8Array>("file:read", path),
  readAsset: (path: string) => call<Uint8Array | null>("asset:read", path),
  writeFileAtomic: (path: string, bytes: Uint8Array, expectedMtime?: number) =>
    call<{ mtime: number }>("file:write", path, bytes, expectedMtime),
  stat: (path: string) => call<{ mtime: number; size: number } | null>("file:stat", path),
  listDocuments: (dir: string) => call<unknown[]>("file:list", dir),
  renameFile: (from: string, to: string) => call<void>("file:rename", from, to),
  revealInFinder: (path: string) => call<void>("shell:reveal", path),
  openExternal: (url: string) => call<void>("shell:external", url),
  writePng: (bytes: Uint8Array) => call<void>("clipboard:png", bytes),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  takePendingOpenPaths: () => call<string[]>("open:take"),
  completeExit: () => call<void>("exit:complete"),
  requestExit: () => call<void>("exit:request"),
  setThemeOverride: (theme: "light" | "dark" | null) => call<void>("theme:set", theme),
  getSystemTheme: () => call<"light" | "dark">("theme:get"),
  setMenu: (model: unknown[]) => call<void>("menu:set", model),
  onOpenFiles: (cb: (paths: string[]) => void) => listen("open-files", cb),
  onCloseRequested: (cb: () => void) => listen("close-requested", cb),
  onMenu: (cb: (id: string) => void) => listen("menu-click", cb),
  onSystemThemeChanged: (cb: (theme: "light" | "dark") => void) =>
    listen("system-theme-changed", cb),
});

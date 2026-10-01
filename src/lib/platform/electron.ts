import type { DragDropEvent, Platform, UploadConfig } from "./types";
import { ConflictError } from "./errors";

function restore(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "Conflict")
    throw new ConflictError();
  if (typeof error === "object" && error !== null && "message" in error)
    throw new Error(String(error.message));
  throw error;
}

export function captureFileDrops(cb: (event: DragDropEvent) => void) {
  let depth = 0;
  const isFile = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");
  const paths = (event: DragEvent) =>
    Array.from(event.dataTransfer?.files ?? [])
      .map((file) => window.folio.getPathForFile(file))
      .filter(Boolean);
  const capture = (event: DragEvent) => {
    if (!isFile(event) && !(event.type === "dragleave" && depth > 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const position = { x: event.clientX, y: event.clientY };
    if (event.type === "dragenter") {
      depth++;
      if (depth === 1) cb({ type: "enter", paths: paths(event), position });
    } else if (event.type === "dragover") {
      cb({ type: "over", paths: paths(event), position });
    } else if (event.type === "dragleave") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) cb({ type: "leave", paths: [] });
    } else if (event.type === "drop") {
      depth = 0;
      cb({ type: "drop", paths: paths(event), position });
    }
  };
  for (const name of ["dragenter", "dragover", "dragleave", "drop"] as const)
    window.addEventListener(name, capture, true);
  return () => {
    for (const name of ["dragenter", "dragover", "dragleave", "drop"] as const)
      window.removeEventListener(name, capture, true);
  };
}

if (typeof document !== "undefined" && "folio" in window) {
  const style = document.createElement("style");
  style.textContent = `[data-drag-region] { -webkit-app-region: drag; }
    [data-drag-region] button, [data-drag-region] input,
    [data-drag-region] a, [data-drag-region] [role="button"] {
      -webkit-app-region: no-drag;
    }`;
  document.head.append(style);
}

const electron: Platform = {
  openFileDialog: (defaultPath) => window.folio.openFileDialog(defaultPath),
  saveFileDialog: (name, ext, filterName) => window.folio.saveFileDialog(name, ext, filterName),
  exportPdf: (html, targetPath) => window.folio.exportPdf(html, targetPath),
  writeHtmlClipboard: (html, text) => window.folio.writeHtmlClipboard(html, text),
  pickFolder: () => window.folio.pickFolder(),
  pickUpic: () =>
    (window.folio as typeof window.folio & { pickUpic(): Promise<string | null> }).pickUpic(),
  uploadImage: (bytes, ext, config) =>
    (
      window.folio as typeof window.folio & {
        uploadImage(bytes: Uint8Array, ext: string, config: UploadConfig): Promise<string>;
      }
    )
      .uploadImage(bytes, ext, config)
      .catch(restore),
  authorizeDocument: (path) => window.folio.authorizeDocument(path),
  authorizeFolder: (path) => window.folio.authorizeFolder(path),
  removeFolderAuthorization: (path) => window.folio.removeFolderAuthorization(path),
  readFile: (path) => window.folio.readFile(path),
  readAsset: (path) => window.folio.readAsset(path),
  readTextFile: async (path) => new TextDecoder().decode(await window.folio.readFile(path)),
  writeFileAtomic: (path, bytes, expectedMtime) =>
    window.folio.writeFileAtomic(path, bytes, expectedMtime).catch(restore),
  stat: (path) => window.folio.stat(path),
  listDocuments: (dir) => window.folio.listDocuments(dir),
  revealInFinder: (path) => window.folio.revealInFinder(path),
  openExternal: (url) => window.folio.openExternal(url),
  renameFile: (from, to) => window.folio.renameFile(from, to).catch(restore),
  onOpenFiles: async (cb) => {
    const stop = window.folio.onOpenFiles(cb);
    const pending = await window.folio.takePendingOpenPaths();
    if (pending.length) cb(pending);
    return stop;
  },
  onDragDrop: async (cb) => captureFileDrops(cb),
  onCloseRequested: async (cb) => window.folio.onCloseRequested(cb),
  onMenu: async (cb) => window.folio.onMenu(cb),
  setThemeOverride: (theme) => window.folio.setThemeOverride(theme),
  getSystemTheme: () => window.folio.getSystemTheme(),
  onSystemThemeChanged: async (cb) => window.folio.onSystemThemeChanged(cb),
  exit: () => window.folio.completeExit(),
  destroy: () => window.folio.completeExit(),
};

export default electron;

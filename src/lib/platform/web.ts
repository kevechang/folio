import type { Platform, FileEntry } from "./types";

const files = new Map<string, File>();

let openCb: ((paths: string[]) => void) | null = null;

function choose(accept: string, directory = false): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (directory) input.setAttribute("webkitdirectory", "");
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const path = file.name;
      files.set(path, file);
      resolve(path);
    };
    input.click();
  });
}

const web: Platform = {
  openFileDialog: () => choose(".excalidraw,.json,.png,.svg,.md,.markdown"),
  saveFileDialog: async (name, ext) => `${name}.${ext}`,
  exportPdf: async () => {
    throw new Error("仅桌面版支持");
  },
  writeHtmlClipboard: async (html, text) => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
      throw new Error("当前浏览器不支持 HTML 剪贴板");
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
  },
  pickFolder: () => choose("", true),
  pickUpic: async () => null,
  uploadImage: async () => {
    throw new Error("仅桌面版支持");
  },
  authorizeDocument: async () => {},
  authorizeFolder: async () => {},
  removeFolderAuthorization: async () => {},
  readAsset: async () => null,
  readFile: async (path) =>
    new Uint8Array(
      (await (files.get(path)?.arrayBuffer() ??
        Promise.reject(new Error("文件不存在")))) as ArrayBuffer,
    ),
  readTextFile: async (path) =>
    await (files.get(path)?.text() ?? Promise.reject(new Error("文件不存在"))),
  writeFileAtomic: async (path, data) => {
    const blob = new Blob([new Uint8Array(data)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { mtime: Date.now() };
  },
  stat: async (path) =>
    files.get(path) ? { mtime: files.get(path)!.lastModified, size: files.get(path)!.size } : null,
  listDocuments: async () => [] as FileEntry[],
  revealInFinder: async () => {},
  openExternal: async (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  },
  renameFile: async (from, to) => {
    const file = files.get(from);
    if (file) {
      files.set(to, file);
      files.delete(from);
    }
  },
  onOpenFiles: async (cb) => {
    openCb = cb;
    return () => {
      openCb = null;
    };
  },
  onDragDrop: async (cb) => {
    const onEvent = (type: "enter" | "over" | "drop" | "leave") => (event: DragEvent) => {
      event.preventDefault();
      const paths = Array.from(event.dataTransfer?.files ?? [], (file) => file.name);
      if (type === "drop") {
        for (const file of Array.from(event.dataTransfer?.files ?? [])) files.set(file.name, file);
      }
      cb({ type, paths, position: { x: event.clientX, y: event.clientY } });
    };
    const handlers = {
      dragenter: onEvent("enter"),
      dragover: onEvent("over"),
      drop: onEvent("drop"),
      dragleave: onEvent("leave"),
    };
    for (const name of Object.keys(handlers) as (keyof typeof handlers)[])
      window.addEventListener(name, handlers[name]);
    return () => {
      for (const name of Object.keys(handlers) as (keyof typeof handlers)[])
        window.removeEventListener(name, handlers[name]);
    };
  },
  onCloseRequested: async () => () => {},
  onMenu: async () => () => {},
  setThemeOverride: async () => {},
  getSystemTheme: async () =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  onSystemThemeChanged: async (cb) => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const handler = () => cb(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  },
  exit: async () => {
    window.close();
  },
  destroy: async () => {
    window.close();
  },
};

export function deliverWebFile(file: File) {
  files.set(file.name, file);
  openCb?.([file.name]);
}

export default web;

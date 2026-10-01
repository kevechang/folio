export type FileEntry = {
  path: string;
  name: string;
  mtime: number;
  size: number;
  kind: "excalidraw" | "png" | "svg" | "markdown";
  title?: string;
  excerpt?: string;
  words?: number;
};

export type FileStat = { mtime: number; size: number };
export type UploadConfig = { storage: "picgo"; url: string } | { storage: "upic"; path: string };

export type DragDropEvent = {
  type: "enter" | "over" | "drop" | "leave";
  paths: string[];
  position?: { x: number; y: number };
};

export interface Platform {
  openFileDialog(defaultPath?: string): Promise<string | null>;
  saveFileDialog(defaultName: string, ext: string, filterName?: string): Promise<string | null>;
  exportPdf(html: string, targetPath: string): Promise<void>;
  writeHtmlClipboard(html: string, text: string): Promise<void>;
  pickFolder(): Promise<string | null>;
  pickUpic(): Promise<string | null>;
  uploadImage(bytes: Uint8Array, ext: string, config: UploadConfig): Promise<string>;
  authorizeDocument(path: string): Promise<void>;
  authorizeFolder(path: string): Promise<void>;
  removeFolderAuthorization(path: string): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  readAsset(path: string): Promise<Uint8Array | null>;
  readTextFile(path: string): Promise<string>;
  writeFileAtomic(
    path: string,
    data: Uint8Array,
    expectedMtime?: number,
  ): Promise<{ mtime: number }>;
  stat(path: string): Promise<FileStat | null>;
  listDocuments(dir: string): Promise<FileEntry[]>;
  revealInFinder(path: string): Promise<void>;
  openExternal(url: string): Promise<void>;
  renameFile(from: string, to: string): Promise<void>;
  onOpenFiles(cb: (paths: string[]) => void): Promise<() => void>;
  onDragDrop(cb: (event: DragDropEvent) => void): Promise<() => void>;
  onCloseRequested(cb: () => void): Promise<() => void>;
  onMenu(cb: (id: string) => void): Promise<() => void>;
  setThemeOverride(theme: "light" | "dark" | null): Promise<void>;
  getSystemTheme(): Promise<"light" | "dark">;
  onSystemThemeChanged(cb: (theme: "light" | "dark") => void): Promise<() => void>;
  exit(): Promise<void>;
  destroy(): Promise<void>;
}

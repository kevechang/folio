import type { FileEntry, FileStat } from "./lib/platform/types";
import type { MenuNode } from "./lib/native-menu";

declare global {
  interface Window {
    folio: {
      openFileDialog(defaultPath?: string): Promise<string | null>;
      saveFileDialog(name: string, ext: string, filterName?: string): Promise<string | null>;
      exportPdf(html: string, targetPath: string): Promise<void>;
      writeHtmlClipboard(html: string, text: string): Promise<void>;
      pickFolder(): Promise<string | null>;
      authorizeDocument(path: string): Promise<void>;
      authorizeFolder(path: string): Promise<void>;
      removeFolderAuthorization(path: string): Promise<void>;
      readFile(path: string): Promise<Uint8Array>;
      readAsset(path: string): Promise<Uint8Array | null>;
      writeFileAtomic(
        path: string,
        bytes: Uint8Array,
        expectedMtime?: number,
      ): Promise<{ mtime: number }>;
      stat(path: string): Promise<FileStat | null>;
      listDocuments(dir: string): Promise<FileEntry[]>;
      renameFile(from: string, to: string): Promise<void>;
      revealInFinder(path: string): Promise<void>;
      openExternal(url: string): Promise<void>;
      writePng(bytes: Uint8Array): Promise<void>;
      getPathForFile(file: File): string;
      takePendingOpenPaths(): Promise<string[]>;
      completeExit(): Promise<void>;
      requestExit(): Promise<void>;
      setThemeOverride(theme: "light" | "dark" | null): Promise<void>;
      getSystemTheme(): Promise<"light" | "dark">;
      setMenu(model: MenuNode[]): Promise<void>;
      onOpenFiles(cb: (paths: string[]) => void): () => void;
      onCloseRequested(cb: () => void): () => void;
      onMenu(cb: (id: string) => void): () => void;
      onSystemThemeChanged(cb: (theme: "light" | "dark") => void): () => void;
    };
  }
}

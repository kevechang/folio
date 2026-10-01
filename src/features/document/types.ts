import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export type DocumentMode = "read" | "edit";

export type SaveState = "saved" | "saving" | "dirty" | "conflict";

export type DocumentData = {
  id: string;
  name: string;
  path: string | null;
  kind: "excalidraw" | "png" | "svg" | "draft" | "markdown";
  mtime: number | null;
  initial: Awaited<ReturnType<typeof import("@excalidraw/excalidraw").loadFromBlob>> | null;
  text?: string;
};

export type LatestScene = {
  elements: readonly OrderedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};

export type DocumentActions = {
  save: () => Promise<boolean>;
  saveAs: () => Promise<boolean>;
  close: () => Promise<void>;
  edit: () => void;
  setMode: (mode: DocumentMode) => void;
  restore: () => Promise<void>;
  exportPng: () => Promise<void>;
  exportSvg: () => Promise<void>;
  exportHtml?: () => Promise<void>;
  exportPdf?: () => Promise<void>;
  copyWechat?: () => Promise<void>;
  copyPng: () => Promise<void>;
  reveal: () => Promise<void>;
  quit: () => Promise<void>;
  grid: () => void;
  focus: () => void;
  insertImages: (paths: string[], position?: { x: number; y: number }) => Promise<void>;
  importLibrary: (path: string) => Promise<void>;
  insertCanvasReference?: (path: string) => void;
  formatCommand?: (command: string) => void;
};

export type DocumentStatus = {
  dirty: boolean;
  path: string | null;
  autoSave: boolean;
  mode: DocumentMode;
};

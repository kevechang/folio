import type { ThemeSetting } from "../../lib/theme";
import type { DocumentActions, DocumentData, DocumentMode, DocumentStatus } from "./types";

export type DocumentViewProps = {
  document: DocumentData;
  theme: "light" | "dark";
  themeSetting: ThemeSetting;
  onTheme: (value: ThemeSetting, origin?: { x: number; y: number }) => void;
  onSettings: () => void;
  onClose: () => void;
  onSaved: (document: DocumentData) => void;
  onMetadata: (path: string, elementCount: number, bg: string, mtime: number) => void;
  onRenamed: (oldPath: string, newPath: string, name: string) => void;
  onCancelPending: () => void;
  onStatus: (status: DocumentStatus) => void;
  onToast: (
    message: string,
    kind?: "success" | "error",
    action?: { label: string; run: () => void },
  ) => void;
  onMode: (mode: DocumentMode) => void;
  register: (actions: DocumentActions) => void;
  onReady: () => void;
  onOpenPath?: (path: string) => Promise<void>;
  onOpenEmbedded?: (path: string, scroll: number, edit?: boolean) => Promise<void>;
  initialEdit?: boolean;
  returnName?: string;
  initialScroll?: number;
};

export const UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    export: false,
    saveAsImage: false,
    saveToActiveFile: false,
    toggleTheme: false,
    clearCanvas: true,
    changeViewBackgroundColor: true,
  },
  tools: { image: true },
} as const;

import type { MutableRefObject } from "react";
import type { DocumentAdapter } from "../../../lib/markdown";
import type { DocumentData, DocumentMode, SaveState } from "../types";

export type Location = { path: string | null; mtime: number | null; kind: DocumentData["kind"] };

export type PersistenceOptions<M> = {
  doc: DocumentData;
  initial: M;
  mode: DocumentMode;
  autoSave: boolean;
  apply: (model: M) => void;
  onClose: () => void;
  onSaved: (document: DocumentData) => void;
  onMetadata: (path: string, elementCount: number, bg: string, mtime: number) => void;
  onRenamed: (oldPath: string, newPath: string, name: string) => void;
  onToast: (message: string, kind?: "success" | "error") => void;
  onCancelPending: () => void;
  afterSave?: (model: M, path: string, mtime: number) => void;
  draftFields?: (model: M) => Record<string, unknown>;
  savedFields?: (model: M) => Partial<DocumentData>;
};

export type PersistenceContext<M> = {
  adapter: DocumentAdapter<M>;
  name: MutableRefObject<string>;
  options: MutableRefObject<PersistenceOptions<M>>;
  model: MutableRefObject<M>;
  baseline: MutableRefObject<string>;
  location: MutableRefObject<Location>;
  saving: MutableRefObject<Promise<boolean> | null>;
  conflict: MutableRefObject<boolean>;
  pending: MutableRefObject<(() => void) | null>;
  dirty: MutableRefObject<boolean>;
  saveTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  draftTimer: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setDirty: (value: boolean) => void;
  setSaveState: (value: SaveState) => void;
  setSaveSequence: React.Dispatch<React.SetStateAction<number>>;
  setShowConflict: (value: boolean) => void;
  setShowUnsaved: (value: boolean) => void;
  setShowRestore: (value: boolean) => void;
  setName: (value: string) => void;
};

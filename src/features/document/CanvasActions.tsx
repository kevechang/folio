import type { RefObject } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useDocumentActions } from "./useDocumentActions";
import type { DocumentActions, DocumentMode } from "./types";
import type { DocumentPersistence } from "./useDocumentPersistence";

export function CanvasActions(props: {
  api: RefObject<ExcalidrawImperativeAPI | null>;
  persistence: DocumentPersistence;
  edit: () => void;
  setDocumentMode: (mode: DocumentMode) => void;
  runExport: (format: "png" | "svg") => Promise<void>;
  copyPng: () => Promise<void>;
  register: (actions: DocumentActions) => void;
}) {
  useDocumentActions(props);
  return null;
}

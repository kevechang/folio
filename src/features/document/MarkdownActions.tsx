import { useEffect, useRef, type RefObject } from "react";
import type { Penna } from "penna-markdown";
import { platform } from "../../lib/platform";
import { relativeDocumentPath } from "../../lib/markdown";
import type { DocumentActions, DocumentMode } from "./types";
import type { DocumentPersistence } from "./useDocumentPersistence";
import { runParagraphCommand } from "../markdown/format-paragraph";

export function MarkdownActions({
  persistence,
  mode,
  setMode,
  register,
  instance,
  onToast,
  onMarkdownExport,
}: {
  persistence: DocumentPersistence;
  mode: DocumentMode;
  setMode: (mode: DocumentMode) => void;
  register: (actions: DocumentActions) => void;
  instance: RefObject<Penna | null>;
  onToast: (message: string, kind?: "success" | "error") => void;
  onMarkdownExport: (format: "html" | "pdf" | "wechat") => Promise<void>;
}) {
  const pendingReference = useRef<string | null>(null);
  useEffect(() => {
    const path = pendingReference.current;
    if (!path || !persistence.path) return;
    pendingReference.current = null;
    const reference = `![](${relativeDocumentPath(persistence.path, path)})`;
    instance.current?.runCommand("insertText", { text: reference, selectFrom: 2, selectTo: 2 });
  }, [persistence.path, instance]);
  useEffect(
    () =>
      register({
        save: () => persistence.save(),
        saveAs: persistence.saveAs,
        close: persistence.close,
        quit: persistence.quit,
        edit: () => setMode(mode === "read" ? "edit" : "read"),
        setMode,
        restore: persistence.restore,
        reveal: async () => {
          if (persistence.path) await platform.revealInFinder(persistence.path);
        },
        exportPng: async () => {},
        exportSvg: async () => {},
        exportHtml: () => onMarkdownExport("html"),
        exportPdf: () => onMarkdownExport("pdf"),
        copyWechat: () => onMarkdownExport("wechat"),
        copyPng: async () => {},
        grid: () => {},
        focus: () => {},
        insertImages: async () => {},
        importLibrary: async () => {},
        insertCanvasReference: (path) => {
          const insert = () => {
            if (!persistence.path) return;
            const reference = `![](${relativeDocumentPath(persistence.path, path)})`;
            instance.current?.runCommand("insertText", {
              text: reference,
              selectFrom: 2,
              selectTo: 2,
            });
          };
          if (!persistence.path) {
            onToast("请先保存文稿", "error");
            pendingReference.current = path;
            void persistence.saveAs().then((saved) => {
              if (!saved) pendingReference.current = null;
            });
          } else insert();
        },
        formatCommand: (command) => {
          if (command === "paragraph") {
            runParagraphCommand(instance.current);
            return;
          }
          if (command === "insertCanvas") {
            void platform.openFileDialog().then((path) => {
              if (path && /\.excalidraw$/i.test(path)) {
                if (!persistence.path) {
                  onToast("请先保存文稿", "error");
                  pendingReference.current = path;
                  void persistence.saveAs().then((saved) => {
                    if (!saved) pendingReference.current = null;
                  });
                } else
                  instance.current?.runCommand("insertText", {
                    text: `![](${relativeDocumentPath(persistence.path, path)})`,
                    selectFrom: 2,
                    selectTo: 2,
                  });
              }
            });
          } else instance.current?.runCommand(command);
        },
      }),
    [persistence, mode, register, setMode, instance, onToast, onMarkdownExport],
  );
  return null;
}

import { useCallback, type RefObject } from "react";
import { listDrafts } from "../../lib/persistence";
import type { DocumentActions, DocumentData, DocumentStatus } from "../document/types";
import { openDocumentFromDraft } from "./openDocument";
import type { Draft } from "../../lib/persistence";
import type { useDocumentTransition } from "./useDocumentTransition";

export function useDocumentCreation(options: {
  docRef: RefObject<DocumentData | null>;
  actions: RefObject<DocumentActions | null>;
  pendingOpen: RefObject<string | null>;
  pendingNew: RefObject<"canvas" | "markdown" | null>;
  statusRef: RefObject<DocumentStatus>;
  setDoc: (document: DocumentData | null) => void;
  transition: ReturnType<typeof useDocumentTransition>;
  toast: (message: string, kind?: "success" | "error") => void;
  syncMenu: () => void;
}) {
  const {
    docRef,
    actions,
    pendingOpen,
    pendingNew,
    statusRef,
    setDoc,
    transition,
    toast,
    syncMenu,
  } = options;
  const { prepareTransition, setReady } = transition;
  const openDraft = useCallback(
    async (draft: Draft, hasThumb: boolean) => {
      try {
        const next = await openDocumentFromDraft(draft);
        if (hasThumb && draft.kind !== "markdown")
          await prepareTransition(draft.id, draft.bg ?? "#FAF9F5");
        setReady(false);
        docRef.current = next;
        statusRef.current = { dirty: false, path: null, autoSave: true, mode: "edit" };
        setDoc(next);
      } catch {
        toast("无法打开草稿", "error");
      }
    },
    [docRef, statusRef, setDoc, prepareTransition, setReady, toast],
  );
  const createDocument = useCallback(
    async (kind: "canvas" | "markdown") => {
      if (docRef.current) {
        pendingNew.current = kind;
        pendingOpen.current = null;
        if (kind === "markdown") await actions.current?.close();
        else void actions.current?.close();
        return;
      }
      const drafts = await listDrafts();
      const stem = kind === "canvas" ? "未命名画布" : "未命名文稿";
      const names = new Set(drafts.map((draft) => draft.name));
      let name = stem;
      let number = 2;
      while (names.has(name)) name = `${stem} ${number++}`;
      const next: DocumentData =
        kind === "canvas"
          ? { id: crypto.randomUUID(), name, path: null, kind: "draft", mtime: null, initial: null }
          : {
              id: crypto.randomUUID(),
              name,
              path: null,
              kind: "markdown",
              mtime: null,
              initial: null,
              text: "",
            };
      setReady(false);
      docRef.current = next;
      statusRef.current = { dirty: false, path: null, autoSave: true, mode: "edit" };
      setDoc(next);
      syncMenu();
    },
    [actions, docRef, pendingNew, pendingOpen, setDoc, setReady, statusRef, syncMenu],
  );
  const newCanvas = useCallback(() => createDocument("canvas"), [createDocument]);
  const newMarkdown = useCallback(() => createDocument("markdown"), [createDocument]);
  return { openDraft, newCanvas, newMarkdown };
}

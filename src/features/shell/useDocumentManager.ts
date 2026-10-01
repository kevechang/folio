import { useCallback, useEffect, useRef, useState } from "react";
import { documentBasename } from "../../lib/document-name";
import { safeSet, upsertRecent, hashPath } from "../../lib/persistence";
import { platform } from "../../lib/platform";
import { generateThumbnail } from "../../lib/thumbnails";
import { scheduleIdle } from "../../lib/idle";
import type { DocumentActions, DocumentData, DocumentStatus } from "../document/types";
import { openDocumentFromPath } from "./openDocument";
import type { useDocumentTransition } from "./useDocumentTransition";
import { nextReturn, type ReturnEntry } from "../markdown/render/return-stack";
import { recentForDocument, useRecentDocuments } from "./useRecentDocuments";
import { useDocumentCreation } from "./useDocumentCreation";

type Options = {
  transition: ReturnType<typeof useDocumentTransition>;
  toast: (message: string, kind?: "success" | "error") => void;
  syncMenu: () => void;
};

export function useDocumentManager({ transition, toast, syncMenu }: Options) {
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [switchingDocument, setSwitchingDocument] = useState(false);
  const [openInEdit, setOpenInEdit] = useState(false);
  const [librarySection, setLibrarySection] = useState("recent");
  const actions = useRef<DocumentActions | null>(null);
  const docRef = useRef<DocumentData | null>(null);
  const pendingOpen = useRef<string | null>(null);
  const editTarget = useRef<string | null>(null);
  const returnStack = useRef<ReturnEntry | null>(null);
  const [returnEntry, setReturnEntry] = useState<ReturnEntry | null>(null);
  const restoreScroll = useRef(0);
  const pendingNew = useRef<"canvas" | "markdown" | null>(null);
  const statusRef = useRef<DocumentStatus>({
    dirty: false,
    path: null,
    autoSave: true,
    mode: "read",
  });
  docRef.current = doc;
  const { prepareTransition, setReady, clearTransition, setPulseId } = transition;

  const { recents, updateRecents, handleSaved, handleRenamed, handleMetadata, setRecentItems } =
    useRecentDocuments(docRef, setDoc, syncMenu);
  const { openDraft, newCanvas, newMarkdown } = useDocumentCreation({
    docRef,
    actions,
    pendingOpen,
    pendingNew,
    statusRef,
    setDoc,
    transition,
    toast,
    syncMenu,
  });
  const clearPending = useCallback(() => {
    if (
      docRef.current &&
      returnStack.current?.path === docRef.current.path &&
      !pendingOpen.current
    ) {
      returnStack.current = null;
      setReturnEntry(null);
    }
    pendingOpen.current = null;
    pendingNew.current = null;
  }, []);
  const openPath = useCallback(
    async (path: string, thumbId?: string, hasThumb = false) => {
      if (docRef.current) {
        pendingOpen.current = path;
        pendingNew.current = null;
        await actions.current?.close();
        return;
      }
      try {
        const loaded = await openDocumentFromPath(path);
        const next = loaded.document;
        await safeSet(`snapshot:${path}`, loaded.snapshot);
        updateRecents((items) => upsertRecent(items, recentForDocument(next)));
        if (thumbId && hasThumb && next.kind !== "markdown")
          await prepareTransition(thumbId, next.initial?.appState.viewBackgroundColor ?? "#FAF9F5");
        setReady(false);
        setOpenInEdit(path === editTarget.current);
        editTarget.current = null;
        docRef.current = next;
        setDoc(next);
        if (next.kind !== "markdown")
          setTimeout(() => generateThumbnail(path, hashPath(path), next.mtime ?? 0), 1500);
        syncMenu();
      } catch {
        setSwitchingDocument(false);
        toast(`无法打开“${documentBasename(path)}”`, "error");
      }
    },
    [syncMenu, toast, updateRecents, prepareTransition, setReady],
  );
  const openEmbedded = useCallback(
    async (path: string, scroll: number, edit = false) => {
      const current = docRef.current;
      if (!current?.path || current.kind !== "markdown") return;
      if (statusRef.current.dirty && !(await actions.current?.save())) return;
      const entry = { path: current.path, name: current.name, scroll };
      returnStack.current = entry;
      setReturnEntry(entry);
      editTarget.current = edit ? path : null;
      await openPath(path);
    },
    [openPath],
  );
  const openDialog = useCallback(async () => {
    const path = await platform.openFileDialog();
    if (path) await openPath(path);
  }, [openPath]);
  useEffect(() => {
    let active = true;
    const unsubs: (() => void)[] = [];
    void platform
      .onOpenFiles((paths) => {
        if (paths[0]) void openPath(paths[0]);
      })
      .then((value) => (active ? unsubs.push(value) : value()));
    void platform
      .onCloseRequested(() => {
        if (actions.current) void actions.current.quit();
        else void platform.exit();
      })
      .then((value) => (active ? unsubs.push(value) : value()));
    return () => {
      active = false;
      unsubs.forEach((value) => value());
    };
  }, [openPath]);
  useEffect(() => {
    if (doc) return;
    return scheduleIdle(() => {
      void import("../document/DocumentShell");
    }, 500);
  }, [doc]);

  const handleClosed = useCallback(() => {
    const closingDoc = docRef.current;
    const closingId =
      closingDoc?.kind === "draft"
        ? closingDoc.id
        : librarySection === "recent" && closingDoc?.path
          ? hashPath(closingDoc.path)
          : (closingDoc?.id ?? null);
    docRef.current = null;
    actions.current = null;
    statusRef.current = { dirty: false, path: null, autoSave: true, mode: "read" };
    const returnTo = pendingOpen.current
      ? null
      : nextReturn(returnStack.current, closingDoc?.path ?? null);
    const nextPath = pendingOpen.current ?? returnTo?.path;
    const create = pendingNew.current;
    setSwitchingDocument(Boolean(nextPath || create));
    setDoc(null);
    clearTransition();
    setPulseId(closingId);
    syncMenu();
    if (returnTo) {
      restoreScroll.current = returnTo.scroll;
      returnStack.current = null;
      setReturnEntry(null);
    } else restoreScroll.current = 0;
    clearPending();
    if (nextPath) void openPath(nextPath);
    else if (create)
      void (create === "markdown" ? newMarkdown() : newCanvas()).catch(() =>
        setSwitchingDocument(false),
      );
  }, [
    clearPending,
    newCanvas,
    newMarkdown,
    openPath,
    syncMenu,
    librarySection,
    clearTransition,
    setPulseId,
  ]);
  const handleStatus = useCallback(
    (status: DocumentStatus) => {
      statusRef.current = status;
      syncMenu();
    },
    [syncMenu],
  );
  const handleMode = useCallback(
    (mode: DocumentStatus["mode"]) => {
      statusRef.current.mode = mode;
      syncMenu();
    },
    [syncMenu],
  );
  return {
    doc,
    switchingDocument,
    finishDocumentEntry: () => setSwitchingDocument(false),
    openInEdit,
    recents,
    librarySection,
    setLibrarySection,
    actions,
    docRef,
    statusRef,
    openPath,
    openEmbedded,
    returnEntry,
    restoreScroll,
    openDraft,
    openDialog,
    newCanvas,
    newMarkdown,
    clearPending,
    handleClosed,
    handleSaved,
    handleRenamed,
    handleStatus,
    handleMetadata,
    handleMode,
    setRecentItems,
  };
}

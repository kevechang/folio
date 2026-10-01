import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentAdapter } from "../../lib/markdown";
import { platform } from "../../lib/platform";
import { documentBasename } from "../../lib/document-name";
import { updateBaseline } from "./dirty";
import type { SaveState } from "./types";
import type { PersistenceContext, PersistenceOptions } from "./persistence/context";
import { usePersistenceOperations } from "./persistence/usePersistenceOperations";
import { usePersistenceLifecycle } from "./persistence/usePersistenceLifecycle";

export function useDocumentPersistence<M>(
  adapter: DocumentAdapter<M>,
  options: PersistenceOptions<M>,
) {
  const current = useRef(options);
  current.current = options;
  const model = useRef(options.initial);
  const baseline = useRef(adapter.fingerprint(options.initial));
  const location = useRef({
    path: options.doc.path,
    mtime: options.doc.mtime,
    kind: options.doc.kind,
  });
  const saving = useRef<Promise<boolean> | null>(null);
  const conflict = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef(0);
  const latestFingerprint = useRef("");
  const [name, setName] = useState(() => documentBasename(options.doc.name));
  const nameRef = useRef(name);
  const setCurrentName = useCallback((value: string) => {
    nameRef.current = value;
    setName(value);
  }, []);
  const [dirty, setDirtyState] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveSequence, setSaveSequence] = useState(0);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirtyState(value);
  }, []);
  const context: PersistenceContext<M> = {
    adapter,
    name: nameRef,
    options: current,
    model,
    baseline,
    location,
    saving,
    conflict,
    pending,
    dirty: dirtyRef,
    saveTimer,
    draftTimer,
    setDirty,
    setSaveState,
    setSaveSequence,
    setShowConflict,
    setShowUnsaved,
    setShowRestore,
    setName: setCurrentName,
  };
  const operations = usePersistenceOperations(context);
  const lifecycle = usePersistenceLifecycle(context, operations);
  const { save, saveAs, loadDisk, restore, rename } = operations;
  const { persistDraft } = lifecycle;

  const onChangeModel = useCallback(
    (value: M) => {
      model.current = value;
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const fingerprint = adapter.fingerprint(model.current);
        if (fingerprint === latestFingerprint.current) return;
        latestFingerprint.current = fingerprint;
        const result = updateBaseline(
          baseline.current,
          fingerprint,
          adapter.kind === "canvas" &&
            current.current.doc.initial === null &&
            !location.current.path,
        );
        baseline.current = result.baseline;
        setDirty(result.dirty);
        setSaveState(conflict.current ? "conflict" : result.dirty ? "dirty" : "saved");
        if (!result.dirty) return;
        if (!location.current.path) {
          if (draftTimer.current) clearTimeout(draftTimer.current);
          draftTimer.current = setTimeout(() => void persistDraft(), 800);
        } else if (current.current.autoSave && current.current.mode === "edit") {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => void save(), 1200);
        }
      });
    },
    [adapter, persistDraft, save, setDirty],
  );

  useEffect(() => {
    if (!options.autoSave && saveTimer.current) clearTimeout(saveTimer.current);
    if (options.mode === "read" && options.autoSave && dirty && location.current.path) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void save();
      return;
    }
    if (!options.autoSave || !dirty || options.mode !== "edit" || !location.current.path) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [options.autoSave, options.mode, dirty, save]);

  useEffect(() => {
    const check = () => {
      const path = location.current.path;
      if (!document.hasFocus() || !path || !location.current.mtime) return;
      void platform.stat(path).then(async (stat) => {
        if (!stat || stat.mtime <= (location.current.mtime ?? 0)) return;
        if (dirtyRef.current) {
          conflict.current = true;
          setSaveState("conflict");
        } else if (await loadDisk()) current.current.onToast("已载入外部修改");
      });
    };
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [loadDisk]);
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (draftTimer.current) clearTimeout(draftTimer.current);
    },
    [],
  );

  const status = !location.current.path
    ? "草稿 · 未存储到文件"
    : location.current.kind !== (adapter.kind === "markdown" ? "markdown" : "excalidraw")
      ? `来自 ${location.current.kind.toUpperCase()} · 另存后可保存`
      : saveState === "conflict"
        ? "外部已修改"
        : saveState === "saving"
          ? "正在保存…"
          : dirty
            ? "已编辑"
            : "已保存";

  return {
    name,
    path: location.current.path,
    getPath: () => location.current.path,
    kind: location.current.kind,
    dirty,
    saveState,
    saveSequence,
    status,
    showUnsaved,
    showConflict,
    showRestore,
    setShowUnsaved: lifecycle.setShowUnsaved,
    setShowConflict,
    setShowRestore,
    save,
    saveAs,
    loadDisk,
    restore,
    rename,
    close: lifecycle.close,
    quit: lifecycle.quit,
    discard: lifecycle.discard,
    cancelUnsaved: lifecycle.cancelUnsaved,
    cancelConflict: lifecycle.cancelConflict,
    resolveConflict: lifecycle.resolveConflict,
    saveAndContinue: lifecycle.saveAndContinue,
    persistDraft,
    onChangeModel,
  };
}

export type DocumentPersistence = ReturnType<typeof useDocumentPersistence<unknown>>;

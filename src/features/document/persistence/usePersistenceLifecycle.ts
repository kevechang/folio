import { useCallback } from "react";
import { platform } from "../../../lib/platform";
import { safeDelete, safeSet, type Draft } from "../../../lib/persistence";
import { draftCloseAction, updateBaseline } from "../dirty";
import type { PersistenceContext } from "./context";
import type { usePersistenceOperations } from "./usePersistenceOperations";

export function usePersistenceLifecycle<M>(
  context: PersistenceContext<M>,
  operations: ReturnType<typeof usePersistenceOperations<M>>,
) {
  const { adapter, options, model, baseline, location, saving, conflict, pending, dirty } = context;
  const persistDraft = useCallback(async () => {
    if (location.current.path || !dirty.current) return;
    const value = model.current;
    const fields = options.current.draftFields?.(value) ?? {};
    await safeSet(`draft:${options.current.doc.id}`, {
      id: options.current.doc.id,
      name: context.name.current,
      json: adapter.kind === "canvas" ? new TextDecoder().decode(adapter.serialize(value)) : "",
      kind: adapter.kind,
      updatedAt: Date.now(),
      ...fields,
    } satisfies Draft);
  }, [adapter]);

  const cancelUnsaved = useCallback(() => {
    pending.current = null;
    context.setShowUnsaved(false);
    options.current.onCancelPending();
  }, []);
  const setShowUnsaved = useCallback(
    (open: boolean) => {
      if (open) context.setShowUnsaved(true);
      else cancelUnsaved();
    },
    [cancelUnsaved],
  );
  const finishClose = useCallback(() => {
    const next = pending.current;
    pending.current = null;
    context.setShowUnsaved(false);
    next?.();
  }, []);
  const discard = useCallback(() => finishClose(), [finishClose]);
  const saveAndContinue = useCallback(async () => {
    const result = location.current.path ? await operations.save() : await operations.saveAs();
    if (result) finishClose();
    else if (conflict.current) context.setShowUnsaved(false);
  }, [operations.save, operations.saveAs, finishClose]);
  const cancelConflict = useCallback(() => {
    context.setShowConflict(false);
    pending.current = null;
    options.current.onCancelPending();
  }, []);
  const resolveConflict = useCallback(
    async (choice: "overwrite" | "saveAs" | "disk") => {
      context.setShowConflict(false);
      const result =
        choice === "overwrite"
          ? await operations.save(true)
          : choice === "saveAs"
            ? await operations.saveAs()
            : await operations.loadDisk(true);
      if (result && pending.current) finishClose();
      else if (!result) context.setShowConflict(true);
    },
    [operations.save, operations.saveAs, operations.loadDisk, finishClose],
  );

  const finish = useCallback(
    async (exit: boolean) => {
      if (context.draftTimer.current) clearTimeout(context.draftTimer.current);
      const checked = updateBaseline(
        baseline.current,
        adapter.fingerprint(model.current),
        adapter.kind === "canvas" && options.current.doc.initial === null && !location.current.path,
      );
      baseline.current = checked.baseline;
      context.setDirty(checked.dirty);
      if (!location.current.path) {
        const initial = options.current.initial;
        const action = draftCloseAction(
          dirty.current,
          adapter.fingerprint(initial) !== adapter.fingerprint(adapter.empty()),
        );
        if (action === "persist") await persistDraft();
        else if (action === "delete") {
          await safeDelete(`draft:${options.current.doc.id}`);
          await safeDelete(`thumb:${options.current.doc.id}`);
        }
        if (exit) await platform.exit();
        else options.current.onClose();
        return;
      }
      if (saving.current) await saving.current;
      if (dirty.current) {
        const continueAction = exit ? () => void platform.exit() : options.current.onClose;
        if (options.current.autoSave && (await operations.save())) {
          continueAction();
          return;
        }
        pending.current = continueAction;
        if (!conflict.current) context.setShowUnsaved(true);
        return;
      }
      if (exit) await platform.exit();
      else options.current.onClose();
    },
    [adapter, operations.save, persistDraft],
  );

  return {
    persistDraft,
    cancelUnsaved,
    setShowUnsaved,
    discard,
    saveAndContinue,
    cancelConflict,
    resolveConflict,
    close: () => finish(false),
    quit: () => finish(true),
  };
}

import { useCallback, useRef } from "react";
import { ConflictError, platform } from "../../../lib/platform";
import { safeDelete, safeGet, safeSet } from "../../../lib/persistence";
import { documentBasename, renameTargetPath } from "../../../lib/document-name";
import type { PersistenceContext } from "./context";

export function usePersistenceOperations<M>(context: PersistenceContext<M>) {
  const { adapter, options, model, baseline, location, saving, conflict } = context;
  const saveRef = useRef<(force?: boolean) => Promise<boolean>>(async () => false);
  const saveAsRef = useRef<() => Promise<boolean>>(async () => false);
  const save = useCallback((force = false) => saveRef.current(force), []);
  const saveAs = useCallback(() => saveAsRef.current(), []);

  saveAsRef.current = async () => {
    const target = await platform.saveFileDialog(
      context.name.current,
      adapter.kind === "markdown" ? "md" : "excalidraw",
    );
    if (!target) return false;
    try {
      const value = model.current;
      const result = await platform.writeFileAtomic(target, adapter.serialize(value));
      await platform.authorizeDocument(target);
      const oldKind = location.current.kind;
      location.current = {
        path: target,
        mtime: result.mtime,
        kind: adapter.kind === "markdown" ? "markdown" : "excalidraw",
      };
      baseline.current = adapter.fingerprint(value);
      conflict.current = false;
      context.setDirty(false);
      context.setSaveState("saved");
      context.setSaveSequence((count) => count + 1);
      if (oldKind === "draft" || (adapter.kind === "markdown" && !options.current.doc.path)) {
        await safeDelete(`draft:${options.current.doc.id}`);
        await safeDelete(`thumb:${options.current.doc.id}`);
      }
      const name = documentBasename(target);
      context.setName(name);
      options.current.onSaved({
        ...options.current.doc,
        ...options.current.savedFields?.(value),
        path: target,
        name,
        kind: location.current.kind,
        mtime: result.mtime,
      });
      options.current.afterSave?.(value, target, result.mtime);
      options.current.onToast("已保存");
      return true;
    } catch {
      options.current.onToast("另存为失败", "error");
      return false;
    }
  };

  saveRef.current = async (force = false) => {
    if (saving.current) return saving.current;
    if (
      !location.current.path ||
      location.current.kind !== (adapter.kind === "markdown" ? "markdown" : "excalidraw")
    )
      return saveAs();
    const task = (async () => {
      try {
        context.setSaveState("saving");
        const value = model.current;
        const path = location.current.path!;
        const result = await platform.writeFileAtomic(
          path,
          adapter.serialize(value),
          force ? undefined : (location.current.mtime ?? undefined),
        );
        location.current.mtime = result.mtime;
        baseline.current = adapter.fingerprint(value);
        const changed = adapter.fingerprint(model.current) !== baseline.current;
        conflict.current = false;
        context.setDirty(changed);
        context.setSaveState(changed ? "dirty" : "saved");
        if (!changed) context.setSaveSequence((count) => count + 1);
        options.current.onSaved({
          ...options.current.doc,
          ...options.current.savedFields?.(value),
          path,
          kind: location.current.kind,
          mtime: result.mtime,
        });
        options.current.afterSave?.(value, path, result.mtime);
        if (changed && options.current.autoSave) {
          if (context.saveTimer.current) clearTimeout(context.saveTimer.current);
          context.saveTimer.current = setTimeout(() => void save(), 1200);
        }
        return true;
      } catch (error) {
        if (error instanceof ConflictError) {
          conflict.current = true;
          context.setSaveState("conflict");
          context.setShowConflict(true);
        } else options.current.onToast("保存失败", "error");
        return false;
      } finally {
        saving.current = null;
      }
    })();
    saving.current = task;
    return task;
  };

  const loadDisk = useCallback(
    async (toast = false) => {
      const path = location.current.path;
      if (!path) return false;
      try {
        const value = await adapter.load(await platform.readFile(path), path);
        options.current.apply(value);
        model.current = value;
        location.current.mtime = (await platform.stat(path))?.mtime ?? null;
        baseline.current = adapter.fingerprint(value);
        conflict.current = false;
        context.setDirty(false);
        context.setSaveState("saved");
        if (toast) options.current.onToast("已载入磁盘版本");
        return true;
      } catch {
        options.current.onToast("载入磁盘版本失败", "error");
        return false;
      }
    },
    [adapter],
  );

  const restore = useCallback(async () => {
    const snapshot = await safeGet<string | null>(
      `snapshot:${location.current.path ?? options.current.doc.id}`,
      null,
    );
    if (snapshot === null) return;
    const value = await adapter.load(
      new TextEncoder().encode(snapshot),
      adapter.kind === "canvas" ? null : location.current.path,
    );
    options.current.apply(value);
    model.current = value;
    baseline.current = adapter.fingerprint(value);
    context.setDirty(false);
    context.setSaveState("saved");
    context.setShowRestore(false);
  }, [adapter]);

  const rename = useCallback(async (input: string) => {
    const name = input.trim();
    if (!name || /[/:\\]/.test(name)) {
      options.current.onToast("名称不能为空，也不能包含 / 或 :", "error");
      return false;
    }
    const oldPath = location.current.path;
    if (!oldPath) {
      context.setName(name);
      return true;
    }
    const target = renameTargetPath(oldPath, name);
    if (!target) return false;
    if (target === oldPath) return true;
    try {
      await platform.renameFile(oldPath, target);
      const snapshot = await safeGet<string | null>(`snapshot:${oldPath}`, null);
      if (snapshot !== null) {
        await safeSet(`snapshot:${target}`, snapshot);
        await safeDelete(`snapshot:${oldPath}`);
      }
      location.current.path = target;
      context.setName(name);
      options.current.onRenamed(oldPath, target, name);
      return true;
    } catch {
      options.current.onToast("重命名失败", "error");
      return false;
    }
  }, []);

  return { save, saveAs, loadDisk, restore, rename };
}

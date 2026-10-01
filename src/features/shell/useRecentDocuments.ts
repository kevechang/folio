import { useCallback, useEffect, useState, type RefObject } from "react";
import {
  hashPath,
  removeRecent,
  safeGet,
  safeSet,
  upsertRecent,
  type Recent,
} from "../../lib/persistence";
import { markdownMetadata } from "../../lib/markdown";
import type { DocumentData } from "../document/types";

export function recentForDocument(document: DocumentData, old?: Recent): Recent {
  const path = document.path ?? "";
  return {
    id: hashPath(path),
    path,
    name: document.name,
    kind: document.kind === "draft" ? "excalidraw" : document.kind,
    lastOpenedAt: Date.now(),
    mtime: document.mtime ?? 0,
    elementCount: old?.elementCount ?? document.initial?.elements.length ?? 0,
    bg: old?.bg ?? document.initial?.appState.viewBackgroundColor ?? "#FAF9F5",
    ...(document.kind === "markdown" ? markdownMetadata(document.text ?? "", document.name) : {}),
  };
}

export function useRecentDocuments(
  docRef: RefObject<DocumentData | null>,
  setDoc: (document: DocumentData | null) => void,
  syncMenu: () => void,
) {
  const [recents, setRecents] = useState<Recent[]>([]);
  useEffect(() => {
    void safeGet<Recent[]>("recents", []).then((items) => {
      const normalized = items.map((item) => ({ ...item, id: hashPath(item.path) }));
      setRecents(normalized);
      if (items.some((item, index) => item.id !== normalized[index].id))
        void safeSet("recents", normalized);
    });
  }, []);
  const updateRecents = useCallback((update: (items: Recent[]) => Recent[]) => {
    setRecents((items) => {
      const next = update(items);
      void safeSet("recents", next);
      return next;
    });
  }, []);
  const handleSaved = useCallback(
    (updated: DocumentData) => {
      docRef.current = updated;
      setDoc(updated);
      updateRecents((items) =>
        upsertRecent(
          items,
          recentForDocument(
            updated,
            items.find((item) => item.path === updated.path),
          ),
        ),
      );
      syncMenu();
    },
    [docRef, setDoc, syncMenu, updateRecents],
  );
  const handleRenamed = useCallback(
    (oldPath: string, newPath: string, name: string) => {
      const current = docRef.current;
      if (current) {
        const updated = { ...current, path: newPath, name };
        docRef.current = updated;
        setDoc(updated);
      }
      updateRecents((items) => {
        const old = items.find((item) => item.path === oldPath);
        const withoutOld = old ? removeRecent(items, old.id) : items;
        const recent = old
          ? { ...old, id: hashPath(newPath), path: newPath, name }
          : recentForDocument({ ...(docRef.current as DocumentData), path: newPath, name });
        return upsertRecent(withoutOld, recent);
      });
      syncMenu();
    },
    [docRef, setDoc, syncMenu, updateRecents],
  );
  const handleMetadata = useCallback(
    (path: string, elementCount: number, bg: string, mtime: number) => {
      updateRecents((items) =>
        items.map((item) => (item.path === path ? { ...item, elementCount, bg, mtime } : item)),
      );
    },
    [updateRecents],
  );
  const setRecentItems = useCallback((items: Recent[]) => {
    setRecents(items);
    void safeSet("recents", items);
  }, []);
  return { recents, updateRecents, handleSaved, handleRenamed, handleMetadata, setRecentItems };
}

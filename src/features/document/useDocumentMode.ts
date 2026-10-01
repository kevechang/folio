import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentMode } from "./types";

export function useDocumentMode(initial: DocumentMode, markdown: boolean) {
  const [mode, setMode] = useState<DocumentMode>(initial);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setDocumentMode = useCallback(
    (next: DocumentMode) => {
      if (next === mode) return;
      if (markdown || next === "edit") {
        setMode(next);
        return;
      }
      setLeaving(true);
      timer.current = setTimeout(
        () => {
          setMode("read");
          setLeaving(false);
        },
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 140,
      );
    },
    [mode, markdown],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { mode, leaving, setDocumentMode };
}

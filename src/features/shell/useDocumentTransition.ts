import { useCallback, useRef, useState } from "react";
import { readThumbnail } from "../../lib/thumbnails";

export function useDocumentTransition() {
  const [ready, setReady] = useState(false);
  const [transitionThumb, setTransitionThumb] = useState<{
    id: string;
    src: string;
    bg: string;
  } | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const transitionUrl = useRef<string | null>(null);

  const clearTransition = useCallback(() => {
    if (transitionUrl.current) URL.revokeObjectURL(transitionUrl.current);
    transitionUrl.current = null;
    setTransitionThumb(null);
  }, []);
  const handleReady = useCallback(() => {
    setReady(true);
    const activeUrl = transitionUrl.current;
    setTimeout(() => {
      if (transitionUrl.current === activeUrl) clearTransition();
    }, 220);
  }, [clearTransition]);
  const prepareTransition = useCallback(async (id: string, bg: string) => {
    const blob = await readThumbnail(id);
    if (!blob) return;
    if (transitionUrl.current) URL.revokeObjectURL(transitionUrl.current);
    const src = URL.createObjectURL(blob);
    transitionUrl.current = src;
    setTransitionThumb({ id, src, bg });
  }, []);

  return {
    ready,
    setReady,
    transitionThumb,
    pulseId,
    setPulseId,
    clearTransition,
    handleReady,
    prepareTransition,
  };
}

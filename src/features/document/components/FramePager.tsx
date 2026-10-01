import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ExcalidrawFrameLikeElement } from "@excalidraw/excalidraw/element/types";
import { IconButton } from "../../../components/ui";
import { clampFramePage } from "../../../lib/frames";

export function FramePager({
  frames,
  page,
  onPage,
}: {
  frames: readonly ExcalidrawFrameLikeElement[];
  page: number;
  onPage: (page: number) => void;
}) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="menu"], [role="dialog"]',
        )
      )
        return;
      let next: number;
      switch (event.key) {
        case "ArrowLeft":
        case "PageUp":
          next = page - 1;
          break;
        case "ArrowRight":
        case "PageDown":
          next = page + 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = frames.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      onPage(clampFramePage(next, frames.length));
    };
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  }, [frames.length, onPage, page]);
  if (!frames.length) return null;
  const current = frames[page];
  return (
    <nav className="folio-frame-pager" aria-label="画布翻页">
      <IconButton label="上一页" disabled={page === 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} />
      </IconButton>
      <span className="folio-frame-name" title={current?.name ?? undefined}>
        {current?.name || `第 ${page + 1} 页`}
      </span>
      <span aria-hidden="true">·</span>
      <span className="folio-frame-count" aria-label={`第 ${page + 1} 页，共 ${frames.length} 页`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={page}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0.12 : 0.16 }}
          >
            {page + 1}
          </motion.span>
        </AnimatePresence>
        <span> / {frames.length}</span>
      </span>
      <IconButton
        label="下一页"
        disabled={page === frames.length - 1}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight size={16} />
      </IconButton>
    </nav>
  );
}

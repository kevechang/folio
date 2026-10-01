import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { gridNextIndex } from "../model";
import type { LibraryItem } from "../types";
import { FileCard } from "./FileCard";

export function FileGrid({
  items,
  onOpen,
  onRemove,
  pulseId,
  filterKey,
  emptyState,
}: {
  items: LibraryItem[];
  onOpen: (item: LibraryItem, hasThumb: boolean) => void;
  onRemove: (item: LibraryItem) => void;
  pulseId: string | null;
  filterKey: string;
  emptyState?: ReactNode;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [settledKey, setSettledKey] = useState(filterKey);
  return (
    <div className="library-grid-stage">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={filterKey}
          className="library-grid-panel"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          onAnimationComplete={() => setSettledKey(filterKey)}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: [0.55, 0, 1, 0.45] } }}
          transition={{
            opacity: { duration: reducedMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] },
            y: { duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] },
          }}
          onKeyDown={(event) => {
            if (!event.key.startsWith("Arrow")) return;
            const cards = Array.from(
              grid.current?.querySelectorAll<HTMLElement>(".library-card-hit") ?? [],
            );
            const index = cards.indexOf(document.activeElement as HTMLElement);
            if (index < 0) return;
            event.preventDefault();
            const columns = Math.max(
              1,
              Math.round((grid.current?.clientWidth ?? 232) / (cards[0]?.clientWidth + 20)),
            );
            cards[gridNextIndex(index, columns, cards.length, event.key)]?.focus();
          }}
        >
          {items.length ? (
            <div ref={grid} className="library-grid">
              {items.map((item, index) => (
                <FileCard
                  key={item.id}
                  item={item}
                  index={index}
                  pulse={item.id === pulseId}
                  disableThumbLayout={settledKey !== filterKey}
                  onOpen={() =>
                    onOpen(
                      item,
                      Boolean(
                        grid.current?.querySelector(`[data-index="${index}"] .library-thumb img`),
                      ),
                    )
                  }
                  onRemove={() => onRemove(item)}
                />
              ))}
            </div>
          ) : (
            emptyState
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

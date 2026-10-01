import { useEffect, type MouseEvent, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../lib/motion";
import { hydrateMarkdown } from "./render/hydrate";
import { usePennaDark } from "./pennaTheme";

export function MarkdownReader({
  html,
  scrollRef,
  position,
  onScroll,
  onClick,
  path,
}: {
  html: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  position: number;
  onScroll: (element: HTMLDivElement) => void;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  path: string | null;
}) {
  const reduced = useReducedMotion();
  const themeRef = usePennaDark();
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = position;
  }, []);
  useEffect(() => {
    const article = scrollRef.current?.querySelector<HTMLElement>(".folio-md");
    return article ? hydrateMarkdown(article, path) : undefined;
  }, [html, path, scrollRef]);
  return (
    <motion.div ref={themeRef} className="penna-theme-default folio-md-reader-host">
      <div className="penna">
        <div className="penna-body">
          <motion.div
            ref={scrollRef}
            className="penna-preview folio-md-reader"
            onScroll={(event) => onScroll(event.currentTarget)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.2 }}
          >
            <motion.article
              className="penna-render folio-md"
              layoutId="folio-md-page"
              transition={reduced ? { duration: 0.12 } : spring.gentle}
              onClick={onClick}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

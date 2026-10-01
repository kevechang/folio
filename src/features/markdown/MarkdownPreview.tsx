import { useEffect, type MouseEvent, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../lib/motion";
import { hydrateMarkdown } from "./render/hydrate";
import { usePennaDark } from "./pennaTheme";

export function MarkdownPreview({
  html,
  scrollRef,
  onClick,
  path,
}: {
  html: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  path: string | null;
}) {
  const reduced = useReducedMotion();
  const themeRef = usePennaDark();
  useEffect(() => {
    const article = scrollRef.current?.querySelector<HTMLElement>(".folio-md");
    return article ? hydrateMarkdown(article, path) : undefined;
  }, [html, path, scrollRef]);
  return (
    <div ref={themeRef} className="penna-theme-default folio-md-preview-host">
      <div className="penna">
        <div className="penna-body">
          <motion.div ref={scrollRef} className="penna-preview folio-md-preview">
            <motion.article
              className="penna-render folio-md"
              onClick={onClick}
              layoutId="folio-md-page"
              transition={reduced ? { duration: 0.12 } : spring.gentle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

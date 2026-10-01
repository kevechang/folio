import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { Penna } from "penna-markdown";
import { scrollSpyIndex } from "../../lib/markdown";
import { useSetting } from "../../lib/useSetting";
import { MD_READING_WIDTHS } from "../../lib/settings";
import type { DocumentMode } from "../document/types";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { MarkdownReader } from "./MarkdownReader";
import { OutlinePanel, type OutlineHeading } from "./OutlinePanel";
import { SplitDivider } from "./SplitDivider";
import { useScrollSync } from "./useScrollSync";
import { MarkdownFind } from "./MarkdownFind";
import { FormatCapsule } from "./FormatCapsule";
import { useCanvasInsert } from "./useCanvasInsert";
import { useMarkdownClicks } from "./useMarkdownClicks";
import { MarkdownLightbox } from "./MarkdownLightbox";

export function MarkdownSurface({
  text,
  html,
  mode,
  path,
  onChange,
  onOpenPath,
  onOpenEmbedded,
  onEdit,
  initialScroll = 0,
  onRequestSave,
  onToast,
  editorInstance,
  outline,
  progress,
  onProgress,
  progressVisible,
  layout,
}: {
  text: string;
  html: string;
  mode: DocumentMode;
  path: string | null;
  onChange: (value: string) => void;
  onOpenPath?: (path: string) => Promise<void>;
  onOpenEmbedded?: (path: string, scroll: number, edit?: boolean) => Promise<void>;
  onEdit?: () => void;
  initialScroll?: number;
  onRequestSave: () => Promise<string | null>;
  onToast: (
    message: string,
    kind?: "success" | "error",
    action?: { label: string; run: () => void },
  ) => void;
  editorInstance: RefObject<Penna | null>;
  outline: boolean;
  progress: number;
  onProgress: (value: number) => void;
  progressVisible: boolean;
  layout: "split" | "edit";
}) {
  const reduced = useReducedMotion();
  const [ratio, setRatio] = useSetting("mdSplitRatio");
  const [readingWidth] = useSetting("mdReadingWidth");
  const [active, setActive] = useState(0);
  const [editorReady, setEditorReady] = useState(false);
  const [lightbox, setLightbox] = useState<HTMLImageElement | null>(null);
  const insertCanvas = useCanvasInsert({
    path,
    onRequestSave,
    onToast,
    instance: editorInstance,
    onOpenEmbedded,
    currentScroll: () => (mode === "read" ? position.current : (preview.current?.scrollTop ?? 0)),
  });
  const handleEditorReady = useCallback(() => setEditorReady(true), []);
  const mount = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const position = useRef(initialScroll);
  const headingAnchor = useRef(0);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useScrollSync(mount, preview, editorReady && mode === "edit" && layout === "split", text);
  const headings = useMemo<OutlineHeading[]>(
    () =>
      Array.from(html.matchAll(/<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi)).map((match, index) => ({
        level: Number(match[1]),
        label: match[2].replace(/<[^>]+>/g, ""),
        index,
      })),
    [html],
  );
  useEffect(() => {
    if (mode !== "read" || !reader.current || !headingAnchor.current) return;
    reader.current.querySelectorAll("h1,h2,h3")[headingAnchor.current]?.scrollIntoView();
  }, [mode]);
  useEffect(
    () => () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    },
    [],
  );
  const { onClick: onLink, openEmbed } = useMarkdownClicks({
    mode,
    text,
    path,
    onChange,
    onOpenPath,
    onOpenEmbedded,
    onEdit,
    onToast,
    setLightbox,
    editorInstance,
    reader,
    preview,
    position,
    reduced,
  });
  const onScroll = useCallback(
    (element: HTMLDivElement) => {
      position.current = element.scrollTop;
      const max = element.scrollHeight - element.clientHeight;
      onProgress(max > 0 ? element.scrollTop / max : 1);
      const nodes = Array.from(element.querySelectorAll("h1,h2,h3"));
      const index = scrollSpyIndex(nodes.map((node) => node.getBoundingClientRect().top));
      setActive(index);
      headingAnchor.current = index;
      if (progressTimer.current) clearTimeout(progressTimer.current);
      progressTimer.current = setTimeout(() => onProgress(-1), 800);
    },
    [onProgress],
  );
  const selectHeading = (index: number) => {
    (mode === "read" ? reader.current : preview.current)
      ?.querySelectorAll("h1,h2,h3")
      [index]?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  return (
    <LayoutGroup>
      <div
        className={`folio-md-body ${mode === "edit" ? "is-edit" : "is-read"}`}
        style={
          { "--folio-md-width": `${MD_READING_WIDTHS[readingWidth]}px` } as React.CSSProperties
        }
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest(".folio-embed-open")) return;
          const embed = (event.target as HTMLElement).closest<HTMLElement>(".folio-embed");
          if (embed?.dataset.path) openEmbed(embed.dataset.path);
        }}
      >
        {outline && headings.length > 0 && (
          <OutlinePanel headings={headings} active={active} onSelect={selectHeading} />
        )}
        <AnimatePresence initial={false}>
          {mode === "edit" && (
            <motion.div
              key="editor"
              className={`folio-md-edit ${layout === "edit" ? "source-only" : ""}`}
              style={
                layout === "split"
                  ? ({ "--md-split-ratio": `${ratio}%` } as React.CSSProperties)
                  : undefined
              }
              initial={{ opacity: 0, x: reduced ? 0 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: reduced ? 0 : -24,
                transition: { duration: reduced ? 0.12 : 0.14 },
              }}
              transition={{ duration: reduced ? 0.12 : 0.24, delay: reduced ? 0 : 0.06 }}
            >
              <MarkdownEditor
                value={text}
                onChange={onChange}
                mount={mount}
                instance={editorInstance}
                onReady={handleEditorReady}
                path={path}
                onRequestSave={onRequestSave}
              />
              <FormatCapsule instance={editorInstance} onCanvas={insertCanvas} />
              {layout === "split" && (
                <>
                  <SplitDivider ratio={ratio} onRatio={setRatio} />
                  <MarkdownPreview html={html} path={path} scrollRef={preview} onClick={onLink} />
                </>
              )}
            </motion.div>
          )}
          {mode === "read" && (
            <MarkdownReader
              html={html}
              path={path}
              scrollRef={reader}
              position={position.current}
              onScroll={onScroll}
              onClick={onLink}
            />
          )}
        </AnimatePresence>
        <span className="folio-md-progress-a11y" aria-live="off">
          {progressVisible ? `${Math.round(progress * 100)}%` : ""}
        </span>
        {mode === "read" && <MarkdownFind reader={reader} html={html} />}
        <AnimatePresence>
          {lightbox && <MarkdownLightbox image={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

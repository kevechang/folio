import { useCallback, type MouseEvent, type RefObject } from "react";
import type { Penna } from "penna-markdown";
import { platform } from "../../lib/platform";
import {
  classifyMarkdownLink,
  relativeDocumentPath,
  resolveRelativePath,
} from "../../lib/markdown";
import type { DocumentMode } from "../document/types";
import { parseEmbed } from "./render/embed";

export function useMarkdownClicks(options: {
  mode: DocumentMode;
  text: string;
  path: string | null;
  onChange: (text: string) => void;
  onOpenPath?: (path: string) => Promise<void>;
  onOpenEmbedded?: (path: string, scroll: number) => Promise<void>;
  onEdit?: () => void;
  onToast: (message: string, kind?: "success" | "error") => void;
  setLightbox: (image: HTMLImageElement) => void;
  editorInstance: RefObject<Penna | null>;
  reader: RefObject<HTMLDivElement | null>;
  preview: RefObject<HTMLDivElement | null>;
  position: RefObject<number>;
  reduced: boolean | null;
}) {
  const {
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
  } = options;
  const openEmbed = useCallback(
    (target: string) => {
      void onOpenEmbedded?.(
        target,
        mode === "read" ? position.current : (preview.current?.scrollTop ?? 0),
      );
    },
    [onOpenEmbedded, mode, position, preview],
  );
  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const element = event.target as HTMLElement;
      const repair = element.closest(".folio-embed-repair");
      if (repair) {
        if (mode !== "edit" || !path) {
          onToast("请切换到编辑模式并保存文稿", "error");
          onEdit?.();
          return;
        }
        const source = repair.parentElement?.dataset.path;
        void platform.openFileDialog().then((selected) => {
          if (!source || !selected || !/\.excalidraw(?:\.(?:png|svg))?$/i.test(selected)) return;
          const reference = relativeDocumentPath(path, selected);
          const next = text.replace(
            /(!\[[^\]]*\]\()([^)]*)(\))/g,
            (match, start: string, target: string, end: string) => {
              const embed = parseEmbed(target);
              return embed?.path === source
                ? `${start}${reference}${embed.title ? ` "${embed.title}"` : ""}${end}`
                : match;
            },
          );
          editorInstance.current?.setMarkdown(next);
          onChange(next);
        });
        return;
      }
      const embed = element.closest<HTMLElement>(".folio-embed");
      if (embed?.dataset.path && element.closest(".folio-embed-open")) {
        openEmbed(embed.dataset.path);
        return;
      }
      const image = element.closest<HTMLImageElement>(".folio-md img");
      if (image?.src) {
        setLightbox(image);
        return;
      }
      const copy = element.closest<HTMLButtonElement>(".folio-md-code-copy");
      if (copy) {
        const source = element.closest("pre")?.querySelector("code")?.textContent ?? "";
        void navigator.clipboard.writeText(source).then(
          () => {
            copy.textContent = "✓";
            copy.classList.add("is-copied");
            setTimeout(() => {
              copy.textContent = "⧉";
              copy.classList.remove("is-copied");
            }, 1200);
            onToast("已复制代码");
          },
          () => onToast("复制失败", "error"),
        );
        return;
      }
      const checkbox = element.closest<HTMLElement>(".task-item .marker");
      if (checkbox && mode === "edit") {
        event.preventDefault();
        const boxes = Array.from(event.currentTarget.querySelectorAll(".task-item .marker"));
        const index = boxes.indexOf(checkbox);
        let seen = -1;
        const next = text.replace(
          /^(\s*[-*+]\s+)\[([ xX])\]/gm,
          (match, prefix: string, mark: string) => {
            seen++;
            return seen === index ? `${prefix}[${mark === " " ? "x" : " "}]` : match;
          },
        );
        editorInstance.current?.setMarkdown(next);
        onChange(next);
        return;
      }
      const anchor = element.closest("a");
      if (!anchor) return;
      event.preventDefault();
      const href = anchor.getAttribute("href") ?? "";
      const kind = classifyMarkdownLink(href);
      if (kind === "anchor")
        reader.current
          ?.querySelector(`[id="${CSS.escape(decodeURIComponent(href.slice(1)))}"]`)
          ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
      else if (kind === "external") void platform.openExternal(href);
      else if (kind === "document" && path && onOpenPath)
        void onOpenPath(resolveRelativePath(path, href.split("#")[0]));
      else onToast("不支持的链接", "error");
    },
    [
      mode,
      text,
      path,
      onChange,
      onOpenPath,
      onEdit,
      onToast,
      reduced,
      editorInstance,
      reader,
      openEmbed,
      setLightbox,
    ],
  );
  return { onClick, openEmbed };
}

import { useEffect, useRef, type RefObject } from "react";
import type { Penna } from "penna-markdown";
import { useSetting } from "../../lib/useSetting";
import { platform } from "../../lib/platform";
import { imageFilename } from "./render/image-name";
import { relativeDocumentPath } from "../../lib/markdown";
import { runParagraphCommand } from "./format-paragraph";
import type { EditorView } from "@codemirror/view";
import type { UploadConfig } from "../../lib/platform/types";

export function MarkdownEditor({
  value,
  onChange,
  mount,
  instance,
  onReady,
  path,
  onRequestSave,
}: {
  value: string;
  onChange: (value: string) => void;
  mount: RefObject<HTMLDivElement | null>;
  instance: RefObject<Penna | null>;
  onReady: () => void;
  path: string | null;
  onRequestSave: () => Promise<string | null>;
}) {
  const initial = useRef(value);
  initial.current = value;
  const currentPath = useRef(path);
  currentPath.current = path;
  const requestSave = useRef(onRequestSave);
  requestSave.current = onRequestSave;
  const [lineNumbers] = useSetting("mdLineNumbers");
  const [imageStorage] = useSetting("mdImageStorage");
  const [picgoUrl] = useSetting("mdPicgoUrl");
  const [upicPath] = useSetting("mdUpicPath");
  const uploadSettings = useRef({ imageStorage, picgoUrl, upicPath });
  uploadSettings.current = { imageStorage, picgoUrl, upicPath };
  useEffect(() => {
    let disposed = false;
    let stop: (() => void) | undefined;
    let stopKey: (() => void) | undefined;
    let stopUpload: (() => void) | undefined;
    void import("penna-markdown").then(({ Penna }) => {
      if (disposed || !mount.current) return;
      const editor = new Penna(mount.current, {
        layout: "edit",
        toolbar: false,
        sidebar: false,
        statusbar: false,
        editor: {
          value: initial.current,
          lineNumbers,
          onParseFile: async (file) => {
            const documentPath = currentPath.current ?? (await requestSave.current());
            if (!documentPath) return { url: "", msg: "请先保存文稿" };
            const bytes = new Uint8Array(await file.arrayBuffer());
            const extension = /image\/(png|jpeg|gif|webp|avif)/.exec(file.type)?.[1];
            if (!extension) return { url: "", msg: "不支持的图片类型" };
            const folder = documentPath.replace(/[^/]+$/, "");
            const stem =
              documentPath
                .split("/")
                .pop()
                ?.replace(/\.(?:md|markdown)$/i, "") ?? "文稿";
            const filename = imageFilename(
              bytes,
              new Date(),
              extension === "jpeg" ? "jpg" : extension,
            );
            const target = `${folder}assets/${stem}/${filename}`;
            await platform.writeFileAtomic(target, bytes);
            return { url: relativeDocumentPath(documentPath, target), msg: "图片已保存" };
          },
        },
        preview: {
          transformerEngineOptions: {
            syntaxOptions: {
              math_block: { apiHost: "" },
              code: { mermaidApiHost: "", echartsApiHost: "" },
            },
          },
        },
      });
      instance.current = editor;
      const view = (editor as unknown as { editor: { getView(): EditorView } }).editor.getView();
      const uploadFile = (file: File, position: number, replaceTo: number) => {
        const placeholder = "![上传中…]()";
        let from = position;
        let to = position + placeholder.length;
        view.dispatch({ changes: { from: position, to: replaceTo, insert: placeholder } });
        const stopTracking = editor.eventBus.on<{
          tr?: Array<{ changes: { mapPos(position: number, assoc?: number): number } }>;
        }>("editor:change", ({ tr }) => {
          for (const transaction of tr ?? []) {
            from = transaction.changes.mapPos(from, 1);
            to = transaction.changes.mapPos(to, -1);
          }
        });
        void (async () => {
          try {
            const extension = /image\/(png|jpeg|gif|webp|avif)/.exec(file.type)?.[1];
            if (!extension) throw new Error("不支持的图片类型");
            const { imageStorage, picgoUrl, upicPath } = uploadSettings.current;
            const config: UploadConfig =
              imageStorage === "picgo"
                ? { storage: "picgo", url: picgoUrl }
                : { storage: "upic", path: upicPath };
            const url = await platform.uploadImage(
              new Uint8Array(await file.arrayBuffer()),
              extension === "jpeg" ? "jpg" : extension,
              config,
            );
            if (disposed) return;
            if (view.state.doc.sliceString(from, to) === placeholder)
              view.dispatch({ changes: { from, to, insert: `![${file.name}](${url})` } });
          } catch (error) {
            if (disposed) return;
            if (view.state.doc.sliceString(from, to) === placeholder)
              view.dispatch({ changes: { from, to, insert: "" } });
            window.dispatchEvent(
              new CustomEvent("folio:upload-error", {
                detail: error instanceof Error ? error.message : "图片上传失败",
              }),
            );
          } finally {
            stopTracking();
          }
        })();
      };
      const intercept = (event: ClipboardEvent | DragEvent) => {
        if (uploadSettings.current.imageStorage === "local") return;
        const files = Array.from(
          event instanceof ClipboardEvent
            ? (event.clipboardData?.files ?? [])
            : (event.dataTransfer?.files ?? []),
        ).filter((file) => file.type.startsWith("image/"));
        if (!files.length) return;
        event.preventDefault();
        event.stopPropagation();
        const position =
          event instanceof DragEvent
            ? (view.posAtCoords({ x: event.clientX, y: event.clientY }) ??
              view.state.selection.main.from)
            : view.state.selection.main.from;
        files.forEach((file, index) =>
          uploadFile(
            file,
            position + index * "![上传中…]()".length,
            index === 0 && event instanceof ClipboardEvent
              ? view.state.selection.main.to
              : position + index * "![上传中…]()".length,
          ),
        );
      };
      mount.current.addEventListener("paste", intercept, true);
      mount.current.addEventListener("drop", intercept, true);
      stopUpload = () => {
        element.removeEventListener("paste", intercept, true);
        element.removeEventListener("drop", intercept, true);
      };
      const onParagraphKey = (event: KeyboardEvent) => {
        if (event.metaKey && !event.shiftKey && !event.altKey && event.key === "0") {
          event.preventDefault();
          event.stopPropagation();
          runParagraphCommand(editor);
        }
      };
      mount.current.addEventListener("keydown", onParagraphKey, true);
      const element = mount.current;
      stopKey = () => element.removeEventListener("keydown", onParagraphKey, true);
      onReady();
      stop = editor.eventBus.on<{ markdown: string }>("editor:change", ({ markdown }) =>
        onChange(markdown),
      );
    });
    return () => {
      disposed = true;
      stop?.();
      stopKey?.();
      stopUpload?.();
      instance.current?.destroy();
      instance.current = null;
    };
  }, [mount, instance, onChange, onReady, lineNumbers]);
  return <div ref={mount} className="folio-md-editor" />;
}

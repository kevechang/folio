import { useEffect, useRef, useState, type RefObject } from "react";
import { resolveDrop, resolveImageContent, type DropLabel } from "../../lib/drop";
import { platform } from "../../lib/platform";
import type { DocumentActions, DocumentData, DocumentStatus } from "../document/types";

type Options = {
  docRef: RefObject<DocumentData | null>;
  statusRef: RefObject<DocumentStatus>;
  actions: RefObject<DocumentActions | null>;
  openPath: (path: string) => Promise<void>;
  toast: (message: string, kind?: "success" | "error") => void;
};

export function useDropHandler({ docRef, statusRef, actions, openPath, toast }: Options) {
  const [dropLabel, setDropLabel] = useState<DropLabel | null>(null);
  const dragPaths = useRef<string[]>([]);
  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | null = null;
    void platform
      .onDragDrop((event) => {
        if (event.type === "leave") {
          dragPaths.current = [];
          setDropLabel(null);
          return;
        }
        if (event.paths.length) dragPaths.current = event.paths;
        const context =
          docRef.current?.kind === "markdown" && statusRef.current.mode === "edit"
            ? "markdown-edit"
            : docRef.current
              ? statusRef.current.mode
              : "library";
        const resolution = resolveDrop({ paths: dragPaths.current, context });
        if (event.type !== "drop") {
          setDropLabel(resolution.label);
          return;
        }
        setDropLabel(null);
        dragPaths.current = [];
        const runDrop = async () => {
          if (resolution.ignored) toast(`已忽略其余 ${resolution.ignored} 个文件`);
          if (resolution.action === "open" && resolution.paths[0]) {
            await openPath(resolution.paths[0]);
          } else if (resolution.action === "insert-reference") {
            actions.current?.insertCanvasReference?.(resolution.paths[0]);
          } else if (resolution.action === "inspect-image") {
            const images: string[] = [];
            for (const path of resolution.paths) {
              let hasScene = false;
              if (/\.(png|svg)$/i.test(path)) {
                try {
                  const bytes = await platform.readFile(path);
                  const type = path.toLowerCase().endsWith(".png") ? "image/png" : "image/svg+xml";
                  const { loadFromBlob } = await import("@excalidraw/excalidraw");
                  await loadFromBlob(new Blob([new Uint8Array(bytes)], { type }), null, null);
                  hasScene = true;
                } catch {
                  hasScene = false;
                }
              }
              const action = resolveImageContent(context, hasScene);
              if (action === "open") {
                await openPath(path);
                return;
              }
              if (action === "insert-images") images.push(path);
            }
            if (context === "edit") await actions.current?.insertImages(images, event.position);
            else toast("这张图片不包含 Excalidraw 场景", "error");
          } else if (resolution.action === "insert-images") {
            await actions.current?.insertImages(resolution.paths, event.position);
          } else if (resolution.action === "import-library") {
            await actions.current?.importLibrary(resolution.paths[0]);
          } else if (resolution.action === "reject-image") {
            toast("这张图片不包含 Excalidraw 场景", "error");
          } else if (resolution.action === "reject-library") {
            toast("请在编辑模式下导入素材库", "error");
          } else toast("不支持这种文件", "error");
        };
        void runDrop().catch(() => toast("无法处理拖入的文件", "error"));
      })
      .then((value) => {
        if (active) unlisten = value;
        else value();
      });
    return () => {
      active = false;
      unlisten?.();
    };
  }, [actions, docRef, openPath, statusRef, toast]);
  return dropLabel;
}

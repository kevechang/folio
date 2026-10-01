import type { RefObject } from "react";
import type { Penna } from "penna-markdown";
import { platform } from "../../lib/platform";
import { relativeDocumentPath } from "../../lib/markdown";

export function useCanvasInsert(options: {
  path: string | null;
  onRequestSave: () => Promise<string | null>;
  onToast: (
    message: string,
    kind?: "success" | "error",
    action?: { label: string; run: () => void },
  ) => void;
  onOpenEmbedded?: (path: string, scroll: number, edit?: boolean) => Promise<void>;
  currentScroll: () => number;
  instance: RefObject<Penna | null>;
}) {
  return async (create: boolean) => {
    const documentPath = options.path ?? (await options.onRequestSave());
    if (!documentPath) {
      options.onToast("请先保存文稿", "error");
      return;
    }
    let canvasPath: string | null = null;
    if (create) {
      const folder = documentPath.replace(/[^/]+$/, "");
      const stem =
        documentPath
          .split("/")
          .pop()
          ?.replace(/\.(md|markdown)$/i, "") ?? "文稿";
      for (let number = 1; number < 1000; number++) {
        const candidate = `${folder}assets/${stem}/画布-${number}.excalidraw`;
        if (await platform.stat(candidate)) continue;
        const scene = {
          type: "excalidraw",
          version: 2,
          elements: [],
          appState: { viewBackgroundColor: "#FAF9F5" },
          files: {},
        };
        await platform.writeFileAtomic(candidate, new TextEncoder().encode(JSON.stringify(scene)));
        canvasPath = candidate;
        break;
      }
    } else {
      const selected = await platform.openFileDialog(documentPath.replace(/[^/]+$/, ""));
      if (selected && /\.excalidraw$/i.test(selected)) canvasPath = selected;
    }
    if (canvasPath) {
      const target = canvasPath;
      const relative = relativeDocumentPath(documentPath, canvasPath);
      options.instance.current?.runCommand("insertText", {
        text: `![](${relative})`,
        selectFrom: 2,
        selectTo: 2,
      });
      if (create)
        options.onToast("已新建画布", "success", {
          label: "立即打开编辑",
          run: () => {
            void options.onOpenEmbedded?.(target, options.currentScroll(), true);
          },
        });
    }
  };
}

import { useCallback, type RefObject } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { copyScenePng, exportScene, type ExportFormat } from "../../lib/exporting";
import { platform } from "../../lib/platform";
import type { DocumentViewProps } from "./document-config";

export function useCanvasExports(
  api: RefObject<ExcalidrawImperativeAPI | null>,
  name: string,
  onToast: DocumentViewProps["onToast"],
) {
  const runExport = useCallback(
    async (format: ExportFormat) => {
      if (!api.current) return;
      try {
        const result = await exportScene(api.current, name, format);
        if (result)
          onToast(`已导出 ${result.filename}`, "success", {
            label: "在 Finder 中显示",
            run: () => void platform.revealInFinder(result.path),
          });
      } catch {
        onToast("导出失败", "error");
      }
    },
    [api, name, onToast],
  );
  const copyPng = useCallback(async () => {
    if (!api.current) return;
    try {
      await copyScenePng(api.current);
      onToast("已拷贝为 PNG");
    } catch {
      onToast("拷贝 PNG 失败", "error");
    }
  }, [api, onToast]);
  return { runExport, copyPng };
}

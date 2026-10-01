import { useCallback, useRef, useState } from "react";
import { platform } from "../../../lib/platform";
import type { DocumentViewProps } from "../../document/document-config";

type Format = "html" | "pdf" | "wechat";

export function useMarkdownExports(
  text: string,
  documentPath: string | null,
  name: string,
  onToast: DocumentViewProps["onToast"],
) {
  const busy = useRef(false);
  const [exporting, setExporting] = useState(false);
  const run = useCallback(
    async (format: Format) => {
      if (busy.current) return;
      busy.current = true;
      setExporting(true);
      try {
        const target =
          format === "wechat"
            ? null
            : await platform.saveFileDialog(
                name,
                format,
                format === "pdf" ? "PDF 文稿" : "HTML 文稿",
              );
        if (format !== "wechat" && !target) return;
        const { renderForExport } = await import("./render");
        const { host, root } = await renderForExport(text, documentPath);
        try {
          if (format === "wechat") {
            const { buildWechatHtml } = await import("./wechat");
            const result = await buildWechatHtml(root, documentPath);
            await platform.writeHtmlClipboard(result.html, result.text);
            const notices = [
              result.hasLargeImages ? "部分图片较大，公众号可能需要手动上传" : "",
              result.rejectedImages ? `${result.rejectedImages} 张图片未能导出` : "",
              result.degradedMath ? `${result.degradedMath} 个公式未能转换为图片` : "",
              result.degradedDiagrams ? `${result.degradedDiagrams} 个图示未能转换为图片` : "",
            ].filter(Boolean);
            onToast(
              `已复制，可直接粘贴到公众号编辑器${notices.length ? `；${notices.join("；")}` : ""}`,
              "success",
            );
          } else {
            const { buildStandaloneHtml } = await import("./html");
            const result = await buildStandaloneHtml(root, {
              title: name,
              documentPath,
              exportTargetPath: target,
              format,
            });
            if (format === "html")
              await platform.writeFileAtomic(target!, new TextEncoder().encode(result.html));
            else await platform.exportPdf(result.html, target!);
            const filename = target!.split("/").pop() ?? `${name}.${format}`;
            onToast(
              `已导出 ${filename}${result.imagesKept ? "；图片较大，已保留相对路径" : ""}${result.rejectedImages ? `；${result.rejectedImages} 张图片未能导出` : ""}`,
              "success",
              {
                label: "在 Finder 中显示",
                run: () => void platform.revealInFinder(target!),
              },
            );
          }
        } finally {
          host.remove();
        }
      } catch (error) {
        onToast(`导出失败：${error instanceof Error ? error.message : String(error)}`, "error");
      } finally {
        busy.current = false;
        setExporting(false);
      }
    },
    [text, documentPath, name, onToast],
  );
  return { run, exporting };
}

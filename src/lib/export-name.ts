export type ExportFormat = "png" | "svg";

export function exportFilename(name: string, format: ExportFormat): string {
  const base =
    name
      .replace(/(?:\.excalidraw)?\.(?:excalidraw|json|png|svg)$/i, "")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/[. ]+$/g, "") || "未命名画布";
  return `${base}.${format}`;
}

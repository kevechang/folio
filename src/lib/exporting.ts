import { exportToBlob, exportToClipboard, exportToSvg } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { platform } from "./platform";
import { exportFilename, type ExportFormat } from "./export-name";

export type { ExportFormat } from "./export-name";

function scene(api: ExcalidrawImperativeAPI) {
  return {
    elements: api.getSceneElements().filter((element) => !element.isDeleted),
    files: api.getFiles(),
    appState: {
      ...api.getAppState(),
      exportBackground: true,
      exportScale: 2,
      exportEmbedScene: true,
      exportWithDarkMode: false,
    },
  };
}

export async function exportScene(
  api: ExcalidrawImperativeAPI,
  name: string,
  format: ExportFormat,
) {
  const filename = exportFilename(name, format);
  const path = await platform.saveFileDialog(filename.slice(0, -(format.length + 1)), format);
  if (!path) return null;
  const options = { ...scene(api), exportPadding: 16 };
  const bytes =
    format === "png"
      ? new Uint8Array(
          await (await exportToBlob({ ...options, mimeType: "image/png" })).arrayBuffer(),
        )
      : new TextEncoder().encode(new XMLSerializer().serializeToString(await exportToSvg(options)));
  await platform.writeFileAtomic(path, bytes);
  return { path, filename: path.split(/[\\/]/).pop() ?? filename };
}

export async function copyScenePng(api: ExcalidrawImperativeAPI) {
  const options = scene(api);
  try {
    await exportToClipboard({ ...options, type: "png", mimeType: "image/png" });
    return "excalidraw" as const;
  } catch (error) {
    if (!("folio" in window)) throw error;
    const blob = await exportToBlob({ ...options, mimeType: "image/png", exportPadding: 16 });
    await window.folio.writePng(new Uint8Array(await blob.arrayBuffer()));
    return "electron" as const;
  }
}

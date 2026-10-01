import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

function elementVersionHash(elements: readonly ExcalidrawElement[]): number {
  let hash = 2166136261;
  for (const element of elements) {
    for (const char of element.id) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= element.version;
    hash = Math.imul(hash, 16777619);
    hash ^= element.versionNonce;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function documentFingerprint(
  elements: readonly ExcalidrawElement[],
  appState: Pick<AppState, "viewBackgroundColor" | "gridSize">,
  files: BinaryFiles,
): string {
  return `${elementVersionHash(elements)}:${Object.keys(files).sort().join(",")}:${appState.viewBackgroundColor}:${appState.gridSize}`;
}

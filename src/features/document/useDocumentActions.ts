import { useEffect, type RefObject } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { platform } from "../../lib/platform";
import type { DocumentActions, DocumentMode } from "./types";
import type { DocumentPersistence } from "./useDocumentPersistence";

export function useDocumentActions({
  api,
  persistence,
  edit,
  setDocumentMode,
  runExport,
  copyPng,
  register,
}: {
  api: RefObject<ExcalidrawImperativeAPI | null>;
  persistence: DocumentPersistence;
  edit: () => void;
  setDocumentMode: (mode: DocumentMode) => void;
  runExport: (format: "png" | "svg") => Promise<void>;
  copyPng: () => Promise<void>;
  register: (actions: DocumentActions) => void;
}) {
  useEffect(() => {
    register({
      save: () => persistence.save(),
      saveAs: persistence.saveAs,
      close: persistence.close,
      edit,
      setMode: setDocumentMode,
      restore: persistence.restore,
      exportPng: () => runExport("png"),
      exportSvg: () => runExport("svg"),
      copyPng,
      reveal: async () => {
        if (persistence.path) await platform.revealInFinder(persistence.path);
      },
      quit: persistence.quit,
      grid: () => {
        if (api.current)
          api.current.updateScene({
            appState: { gridModeEnabled: !api.current.getAppState().gridModeEnabled },
          });
      },
      insertImages: async (paths, position) => {
        if (!api.current) return;
        const { viewportCoordsToSceneCoords, convertToExcalidrawElements } =
          await import("@excalidraw/excalidraw");
        const state = api.current.getAppState();
        const point = viewportCoordsToSceneCoords(
          {
            clientX: position?.x ?? window.innerWidth / 2,
            clientY: position?.y ?? window.innerHeight / 2,
          },
          state,
        );
        let x = point.x;
        const elements = [];
        for (const path of paths) {
          const bytes = await platform.readFile(path);
          const ext = path.toLowerCase().split(".").pop();
          const mimeType =
            ext === "jpg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : `image/${ext}`;
          const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
          const dataURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          const dimensions = await new Promise<{ width: number; height: number }>(
            (resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve({ width: image.width, height: image.height });
              image.onerror = reject;
              image.src = dataURL;
            },
          );
          const scale = Math.min(1, 800 / Math.max(dimensions.width, dimensions.height));
          const width = dimensions.width * scale;
          const height = dimensions.height * scale;
          const id = crypto.randomUUID();
          // Excalidraw brands validated image IDs and data URLs at its API boundary.
          api.current.addFiles([
            { id, dataURL, mimeType, created: Date.now() } as Parameters<
              ExcalidrawImperativeAPI["addFiles"]
            >[0][number],
          ]);
          elements.push(
            ...convertToExcalidrawElements([
              {
                type: "image",
                x,
                y: point.y,
                width,
                height,
                fileId: id as Parameters<ExcalidrawImperativeAPI["addFiles"]>[0][number]["id"],
              },
            ]),
          );
          x += width + 24;
        }
        api.current.updateScene({ elements: [...api.current.getSceneElements(), ...elements] });
      },
      importLibrary: async (path) => {
        if (!api.current) return;
        const bytes = await platform.readFile(path);
        const { loadLibraryFromBlob } = await import("@excalidraw/excalidraw");
        const libraryItems = await loadLibraryFromBlob(
          new Blob([new Uint8Array(bytes)], { type: "application/json" }),
        );
        await api.current.updateLibrary({ libraryItems, merge: true, openLibraryMenu: true });
      },
      focus: () => {
        if (api.current)
          api.current.updateScene({
            appState: { zenModeEnabled: !api.current.getAppState().zenModeEnabled },
          });
      },
    });
  }, [register, persistence, edit, setDocumentMode, runExport, copyPng]);
}

import { loadFromBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import type { DocumentAdapter } from "./markdown";
import type { DocumentData, LatestScene } from "../features/document/types";
import { documentFingerprint } from "./scene";
import { inferBoundTextAlign } from "./bound-text";

export type CanvasModel = {
  elements: LatestScene["elements"];
  appState: LatestScene["appState"] | NonNullable<DocumentData["initial"]>["appState"];
  files: LatestScene["files"];
};

export const canvasAdapter: DocumentAdapter<CanvasModel | null> = {
  kind: "canvas",
  extensions: [".excalidraw", ".excalidraw.png", ".excalidraw.svg"],
  load: async (bytes, path) => {
    const mime = path?.toLowerCase().endsWith(".png")
      ? "image/png"
      : path?.toLowerCase().endsWith(".svg")
        ? "image/svg+xml"
        : "application/vnd.excalidraw+json";
    const scene = await loadFromBlob(new Blob([new Uint8Array(bytes)], { type: mime }), null, null);
    return {
      elements: inferBoundTextAlign(scene.elements),
      appState: scene.appState,
      files: scene.files,
    };
  },
  serialize: (scene) => {
    if (!scene) throw new Error("Canvas scene is empty");
    return new TextEncoder().encode(
      serializeAsJSON(scene.elements, scene.appState, scene.files, "local"),
    );
  },
  fingerprint: (scene) =>
    scene ? documentFingerprint(scene.elements, scene.appState, scene.files) : "",
  empty: () => null,
};

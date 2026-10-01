import type { Draft } from "../../lib/persistence";
import { documentBasename } from "../../lib/document-name";
import { platform } from "../../lib/platform";
import type { CanvasModel } from "../../lib/canvas-adapter";
import type { DocumentData } from "../document/types";

type Source =
  { kind: "path"; path: string; mtime: number | null } | { kind: "draft"; draft: Draft };

function createDocumentData(source: Source, scene: CanvasModel): DocumentData {
  const initial = { ...scene, elements: [...scene.elements] };
  if (source.kind === "draft") {
    return {
      id: source.draft.id,
      name: source.draft.name,
      path: null,
      kind: "draft",
      mtime: null,
      initial,
    };
  }
  const kind = source.path.toLowerCase().endsWith(".png")
    ? "png"
    : source.path.toLowerCase().endsWith(".svg")
      ? "svg"
      : "excalidraw";
  return {
    id: source.path,
    name: documentBasename(source.path),
    path: source.path,
    kind,
    mtime: source.mtime,
    initial,
  };
}

export async function openDocumentFromPath(path: string): Promise<{
  document: DocumentData;
  snapshot: string;
}> {
  await platform.authorizeDocument(path);
  const bytes = await platform.readFile(path);
  const lower = path.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    const { markdownAdapter } = await import("../../lib/markdown");
    const text = await markdownAdapter.load(bytes, path);
    return {
      document: {
        id: path,
        name: documentBasename(path),
        path,
        kind: "markdown",
        mtime: (await platform.stat(path))?.mtime ?? null,
        initial: null,
        text,
      },
      snapshot: text,
    };
  }
  const { canvasAdapter } = await import("../../lib/canvas-adapter");
  const scene = await canvasAdapter.load(bytes, path);
  if (!scene) throw new Error("Canvas scene is empty");
  const stat = await platform.stat(path);
  return {
    document: createDocumentData({ kind: "path", path, mtime: stat?.mtime ?? null }, scene),
    snapshot: new TextDecoder().decode(canvasAdapter.serialize(scene)),
  };
}

export async function openDocumentFromDraft(draft: Draft): Promise<DocumentData> {
  if (draft.kind === "markdown")
    return {
      id: draft.id,
      name: draft.name,
      path: null,
      kind: "markdown",
      mtime: null,
      initial: null,
      text: draft.text ?? "",
    };
  const { canvasAdapter } = await import("../../lib/canvas-adapter");
  const scene = await canvasAdapter.load(new TextEncoder().encode(draft.json), null);
  if (!scene) throw new Error("Canvas scene is empty");
  return createDocumentData({ kind: "draft", draft }, scene);
}

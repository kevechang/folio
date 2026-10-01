// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { platform } from "../src/lib/platform";
import { canvasAdapter } from "../src/lib/canvas-adapter";
import { updateBaseline } from "../src/features/document/dirty";
import { openDocumentFromDraft, openDocumentFromPath } from "../src/features/shell/openDocument";

vi.mock("@excalidraw/excalidraw", () => ({
  loadFromBlob: async (blob: Blob) => JSON.parse(await blob.text()),
  serializeAsJSON: (elements: unknown, appState: unknown, files: unknown) =>
    JSON.stringify({ type: "excalidraw", elements, appState, files }),
}));

const container = (id: string) => ({
  id,
  type: "rectangle",
  x: 100,
  y: 160,
  width: 200,
  height: 96,
  boundElements: [{ id: `${id}-text`, type: "text" }],
  groupIds: ["outer"],
  version: 3,
  versionNonce: 30,
  isDeleted: false,
});
const text = (id: string, y: number) => ({
  id: `${id}-text`,
  type: "text",
  containerId: id,
  x: 120,
  y,
  width: 160,
  height: 26,
  verticalAlign: "top",
  textAlign: "center",
  autoResize: false,
  lineHeight: 1.25,
  text: "绑定文字",
  originalText: "绑定文字",
  version: 7,
  versionNonce: 42,
  groupIds: ["outer"],
  isDeleted: false,
});
const scene = {
  type: "excalidraw",
  elements: [container("bottom"), text("bottom", 213), container("middle"), text("middle", 195)],
  appState: { viewBackgroundColor: "#ffffff", gridSize: null },
  files: {},
};
const bytes = new TextEncoder().encode(JSON.stringify(scene));

afterEach(() => vi.restoreAllMocks());

function assertPlacement(
  initial: NonNullable<Awaited<ReturnType<typeof openDocumentFromDraft>>["initial"]>,
) {
  const bottom = initial.elements.find((element) => element.id === "bottom-text");
  const middle = initial.elements.find((element) => element.id === "middle-text");
  expect(bottom).toMatchObject({
    containerId: null,
    x: 120,
    y: 213,
    height: 26,
    version: 7,
    versionNonce: 42,
  });
  expect(middle).toMatchObject({
    containerId: "middle",
    verticalAlign: "middle",
    x: 120,
    y: 195,
    height: 26,
    version: 7,
    versionNonce: 42,
  });
  expect(initial.elements.find((element) => element.id === "bottom")).toMatchObject({
    y: 160,
    height: 96,
    boundElements: [],
    version: 3,
    versionNonce: 30,
  });
  const box = initial.elements.find((element) => element.id === "bottom")!;
  expect(box.groupIds[0]).toBe(bottom!.groupIds[0]);
  expect(box.groupIds.slice(1)).toEqual(["outer"]);
  expect(bottom!.groupIds.slice(1)).toEqual(["outer"]);
}

describe("opening bound text scenes", () => {
  it("normalizes file initialData and snapshot without marking the scene dirty", async () => {
    const authorize = vi.spyOn(platform, "authorizeDocument").mockResolvedValue();
    const read = vi.spyOn(platform, "readFile").mockResolvedValue(bytes);
    const stat = vi.spyOn(platform, "stat").mockResolvedValue({ mtime: 123, size: bytes.length });
    const loaded = await openDocumentFromPath("/docs/bound.excalidraw");
    expect(authorize).toHaveBeenCalledWith("/docs/bound.excalidraw");
    expect(read).toHaveBeenCalledWith("/docs/bound.excalidraw");
    expect(stat).toHaveBeenCalledWith("/docs/bound.excalidraw");
    const initial = loaded.document.initial!;
    assertPlacement(initial);
    const snapshot = JSON.parse(loaded.snapshot);
    expect(snapshot.elements[1].containerId).toBeNull();
    expect(snapshot.elements[0].boundElements).toEqual([]);
    expect(snapshot.elements[3].verticalAlign).toBe("middle");
    const baseline = canvasAdapter.fingerprint(initial);
    expect(canvasAdapter.fingerprint(scene as typeof initial)).toBe(baseline);
    expect(updateBaseline(baseline, canvasAdapter.fingerprint(initial), false).dirty).toBe(false);
  });

  it("normalizes a saved canvas draft before initialData", async () => {
    const loaded = await openDocumentFromDraft({
      id: "draft-1",
      name: "草稿",
      kind: "canvas",
      json: JSON.stringify(scene),
      updatedAt: 1,
    });
    expect(loaded.kind).toBe("draft");
    assertPlacement(loaded.initial!);
    expect(canvasAdapter.fingerprint(loaded.initial)).toBe(
      canvasAdapter.fingerprint(scene as NonNullable<typeof loaded.initial>),
    );
  });
});

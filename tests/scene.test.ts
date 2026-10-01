import { describe, expect, it } from "vitest";
import { documentFingerprint } from "../src/lib/scene";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const state = { viewBackgroundColor: "#FAF9F5", gridSize: 20 } as AppState;

const files = {} as BinaryFiles;
// Fingerprinting reads only these version fields; the test does not render elements.
const element = { id: "shape-1", version: 1, versionNonce: 17 } as ExcalidrawElement;

describe("documentFingerprint", () => {
  it("ignores scroll, zoom, and selection", () => {
    const baseline = documentFingerprint([element], state, files);
    const viewport = {
      ...state,
      scrollX: 500,
      scrollY: -240,
      zoom: { value: 0.5 as AppState["zoom"]["value"] },
      selectedElementIds: { "shape-1": true },
    } as AppState;
    expect(documentFingerprint([element], viewport, files)).toBe(baseline);
  });

  it("changes for an element version", () => {
    const changed = { ...element, version: 2 } as ExcalidrawElement;
    expect(documentFingerprint([changed], state, files)).not.toBe(
      documentFingerprint([element], state, files),
    );
  });

  it("changes for file ids and background", () => {
    // Only file IDs are read by the fingerprint.
    const withFile = { "image-1": {} } as unknown as BinaryFiles;
    expect(documentFingerprint([element], state, withFile)).not.toBe(
      documentFingerprint([element], state, files),
    );
    expect(
      documentFingerprint([element], { ...state, viewBackgroundColor: "#fff" }, files),
    ).not.toBe(documentFingerprint([element], state, files));
  });
});

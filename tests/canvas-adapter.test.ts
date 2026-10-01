// @vitest-environment jsdom
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
vi.mock("@excalidraw/excalidraw", () => ({
  loadFromBlob: async (blob: Blob) => JSON.parse(await blob.text()),
  serializeAsJSON: (elements: unknown, appState: unknown, files: unknown) =>
    JSON.stringify({ type: "excalidraw", elements, appState, files }),
}));
import { canvasAdapter } from "../src/lib/canvas-adapter";

describe("canvas adapter", () => {
  it("loads and serializes the existing blank canvas format", async () => {
    const bytes = await readFile("docs/samples/blank.excalidraw");
    const scene = await canvasAdapter.load(bytes, "blank.excalidraw");
    expect(scene).not.toBeNull();
    expect(new TextDecoder().decode(canvasAdapter.serialize(scene))).toContain(
      '"type":"excalidraw"',
    );
    expect(canvasAdapter.fingerprint(scene)).toBe(canvasAdapter.fingerprint(scene));
    expect(canvasAdapter.empty()).toBeNull();
  });
});

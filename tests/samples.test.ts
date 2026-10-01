// @vitest-environment jsdom
// The app tsconfig intentionally has no Node types; Vitest provides these at runtime.
// @ts-expect-error Node built-in in the test runner
import { readFile } from "node:fs/promises";
// @ts-expect-error Node built-in in the test runner
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { orderFrames } from "../src/lib/frames";

describe("sample scenes", () => {
  for (const name of ["frames", "embedded-image", "blank"]) {
    it(`loads ${name} with loadFromBlob`, async () => {
      const bytes = await readFile(resolve(`docs/samples/${name}.excalidraw`));
      HTMLCanvasElement.prototype.getContext = (() => ({
        filter: "none",
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      const scene = await loadFromBlob(
        new Blob([bytes], { type: "application/vnd.excalidraw+json" }),
        null,
        null,
      );
      expect(scene.elements).toBeDefined();
      if (name === "frames") {
        expect(orderFrames(scene.elements).length).toBe(3);
        expect(
          scene.elements.filter((element) => element.type !== "frame").length,
        ).toBeGreaterThanOrEqual(6);
      }
      if (name === "embedded-image") expect(Object.keys(scene.files).length).toBe(1);
    });
  }
});

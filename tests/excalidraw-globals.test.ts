// @vitest-environment jsdom
// @ts-expect-error Node types are excluded from the app test TypeScript project.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

describe("Excalidraw globals", () => {
  it("sets the asset path and render throttling before Excalidraw loads", async () => {
    vi.resetModules();
    await import("../src/asset-path");
    expect(window.EXCALIDRAW_THROTTLE_RENDER).toBe(true);
    expect(window.EXCALIDRAW_ASSET_PATH).toBe(`${window.location.origin}/excalidraw-assets/`);

    const main = readFileSync("src/main.tsx", "utf8");
    expect(main.match(/^\s*import\s+["']([^"']+)["']/)?.[1]).toBe("./asset-path");
  });
});

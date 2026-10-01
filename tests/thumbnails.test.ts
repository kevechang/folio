import { afterEach, expect, it, vi } from "vitest";
import type { LatestScene } from "../src/features/document/types";

const records = vi.hoisted(() => new Map<string, unknown>());
vi.mock("idb-keyval", () => ({
  get: async (key: string) => records.get(key),
  set: async (key: string, value: unknown) => {
    records.set(key, value);
  },
  del: async (key: string) => {
    records.delete(key);
  },
  keys: async () => [...records.keys()],
}));
vi.mock("../src/lib/platform", () => ({ platform: {} }));
vi.mock("@excalidraw/excalidraw", () => ({
  exportToBlob: async () => new Blob(["thumbnail"], { type: "image/png" }),
}));

import { readThumbnailRecord, storeSceneThumbnail } from "../src/lib/thumbnails";

const scene = {
  elements: [],
  files: {},
  appState: { viewBackgroundColor: "#FAF9F5" },
} as unknown as LatestScene;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  records.clear();
});

it("reads a saved file thumbnail with the same returned mtime", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal(
    "CustomEvent",
    class {
      constructor(_type: string, _init: unknown) {}
    },
  );
  storeSceneThumbnail("file", scene, 1234);
  await vi.runAllTimersAsync();
  expect((await readThumbnailRecord("file", 1234))?.mtime).toBe(1234);
  expect(await readThumbnailRecord("file", 1235)).toBeNull();
});

it("reads a draft thumbnail with its updatedAt", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal(
    "CustomEvent",
    class {
      constructor(_type: string, _init: unknown) {}
    },
  );
  const updatedAt = 9876;
  storeSceneThumbnail("draft", scene, updatedAt);
  await vi.runAllTimersAsync();
  expect((await readThumbnailRecord("draft", updatedAt))?.mtime).toBe(updatedAt);
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMBED_RATIO,
  embedAspectRatio,
  embedRatioKey,
} from "../src/features/markdown/render/embed-ratio";

describe("canvas embed aspect ratio", () => {
  it("includes export padding around element bounds", () => {
    expect(embedAspectRatio([10, 20, 210, 120])).toBe(232 / 132);
  });
  it("uses 16:9 for an empty or invalid scene", () => {
    expect(embedAspectRatio(null)).toBe(DEFAULT_EMBED_RATIO);
    expect(embedAspectRatio([0, 0, 0, 0])).toBe(DEFAULT_EMBED_RATIO);
  });
  it("caches by path and mtime, independently of theme", () => {
    expect(embedRatioKey("/a.excalidraw", 1)).not.toBe(embedRatioKey("/a.excalidraw", 2));
    expect(embedRatioKey("/a.excalidraw", 1)).not.toBe(embedRatioKey("/b.excalidraw", 1));
  });
});

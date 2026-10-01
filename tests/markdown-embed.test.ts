import { describe, expect, it } from "vitest";
import { embedCacheKey, parseEmbed } from "../src/features/markdown/render/embed";
import { imageFilename } from "../src/features/markdown/render/image-name";
import { nextReturn } from "../src/features/markdown/render/return-stack";
import { shortcutConflicts } from "../src/features/markdown/format-commands";
import { DEFAULT_SHORTCUTS } from "penna-markdown";

describe("markdown canvas embed syntax", () => {
  it("recognizes relative paths and optional titles", () => {
    expect(parseEmbed('./frames.excalidraw "画布"')).toEqual({
      path: "./frames.excalidraw",
      title: "画布",
    });
    expect(parseEmbed("../frames.excalidraw.png")).toEqual({
      path: "../frames.excalidraw.png",
      title: "",
    });
    expect(parseEmbed("../frames.excalidraw.svg")?.path).toBe("../frames.excalidraw.svg");
    expect(parseEmbed("https://example.org/a.excalidraw")).toBeNull();
    expect(parseEmbed("./photo.png")).toBeNull();
  });
  it("invalidates the cache on mtime or theme changes", () => {
    expect(embedCacheKey("a", 1, "light")).not.toBe(embedCacheKey("a", 2, "light"));
    expect(embedCacheKey("a", 1, "light")).not.toBe(embedCacheKey("a", 1, "dark"));
  });
  it("names images with timestamp and content hash", () => {
    const date = new Date(2026, 8, 25, 9, 3, 4);
    const name = imageFilename(new Uint8Array([1, 2, 3]), date, "png");
    expect(name).toMatch(/^20260925-090304-[a-f0-9]{8}\.png$/);
    expect(name).not.toBe(imageFilename(new Uint8Array([1, 2, 4]), date, "png"));
  });
  it("returns only when closing an embedded canvas", () => {
    const entry = { path: "/notes/a.md", name: "a", scroll: 250 };
    expect(nextReturn(entry, "/notes/figure.excalidraw")).toEqual(entry);
    expect(nextReturn(entry, entry.path)).toBeNull();
    expect(nextReturn(null, "/notes/figure.excalidraw")).toBeNull();
  });
  it("detects key changes relative to Penna defaults", () => {
    expect(shortcutConflicts(DEFAULT_SHORTCUTS)).toEqual([]);
  });
});

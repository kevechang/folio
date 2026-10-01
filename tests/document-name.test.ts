import { describe, expect, it } from "vitest";
import { documentBasename, renameTargetPath } from "../src/lib/document-name";

describe("document names", () => {
  it("shows a basename without a scene extension", () => {
    expect(documentBasename("/画布/设计.excalidraw")).toBe("设计");
    expect(documentBasename("/画布/设计.excalidraw.png")).toBe("设计");
  });

  it("preserves the original extension on rename", () => {
    expect(renameTargetPath("/画布/设计.excalidraw", "新版")).toBe("/画布/新版.excalidraw");
    expect(renameTargetPath("/画布/设计.excalidraw.png", "新版")).toBe("/画布/新版.excalidraw.png");
  });

  it("rejects empty names and path separators or colons", () => {
    expect(renameTargetPath("/画布/设计.excalidraw", " ")).toBeNull();
    expect(renameTargetPath("/画布/设计.excalidraw", "a/b")).toBeNull();
    expect(renameTargetPath("/画布/设计.excalidraw", "a:b")).toBeNull();
  });
});

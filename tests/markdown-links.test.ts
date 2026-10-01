import { describe, expect, it } from "vitest";
import {
  classifyMarkdownLink,
  resolveRelativePath,
  relativeDocumentPath,
} from "../src/lib/markdown";

describe("markdown links", () => {
  it("classifies anchors, external and local documents", () => {
    expect(classifyMarkdownLink("#intro")).toBe("anchor");
    expect(classifyMarkdownLink("mailto:a@example.com")).toBe("external");
    expect(classifyMarkdownLink("https://example.com")).toBe("external");
    expect(classifyMarkdownLink("../a.md")).toBe("document");
    expect(classifyMarkdownLink("javascript:alert(1)")).toBe("unsupported");
  });
  it("resolves relative paths", () => {
    expect(resolveRelativePath("/books/chapter/a.md", "../image.png")).toBe("/books/image.png");
    expect(relativeDocumentPath("/books/chapter/a.md", "/books/frames.excalidraw")).toBe(
      "../frames.excalidraw",
    );
  });
});

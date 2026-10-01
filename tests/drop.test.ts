import { describe, expect, it } from "vitest";
import { resolveDrop, resolveImageContent } from "../src/lib/drop";

const scene = "/a.excalidraw";
const embedded = "/a.png";
const svg = "/a.svg";
const image = "/a.jpg";
const library = "/a.excalidrawlib";

describe("resolveDrop dispatch table", () => {
  it.each(["library", "read", "edit"] as const)("opens scene in %s", (context) => {
    expect(resolveDrop({ paths: [scene], context })).toMatchObject({
      label: "open",
      action: "open",
    });
    expect(resolveDrop({ paths: ["/a.json"], context }).action).toBe("open");
  });
  it.each(["library", "read"] as const)("inspects embedded PNG and SVG in %s", (context) => {
    for (const path of [embedded, svg])
      expect(resolveDrop({ paths: [path], context })).toMatchObject({
        label: "open",
        action: "inspect-image",
      });
  });
  it("inspects ambiguous images in edit mode", () => {
    for (const path of [embedded, svg])
      expect(resolveDrop({ paths: [path], context: "edit" })).toMatchObject({
        label: "insert",
        action: "inspect-image",
      });
  });
  it.each(["library", "read"] as const)("rejects ordinary images in %s", (context) => {
    for (const ext of ["jpg", "jpeg", "webp", "gif"])
      expect(resolveDrop({ paths: [`/a.${ext}`], context }).action).toBe("reject-image");
  });
  it("inserts ordinary images in edit mode and preserves order", () => {
    expect(resolveDrop({ paths: [image, "/b.webp"], context: "edit" })).toMatchObject({
      action: "insert-images",
      paths: [image, "/b.webp"],
      ignored: 0,
    });
  });
  it.each(["library", "read"] as const)("rejects library in %s", (context) => {
    expect(resolveDrop({ paths: [library], context }).action).toBe("reject-library");
  });
  it("imports library in edit mode", () => {
    expect(resolveDrop({ paths: [library], context: "edit" })).toMatchObject({
      label: "library",
      action: "import-library",
    });
  });
  it("chooses first openable file and reports ignored files", () => {
    expect(resolveDrop({ paths: ["/bad.xyz", embedded, scene], context: "library" })).toMatchObject(
      { paths: [embedded], ignored: 2 },
    );
  });

  it.each(["library", "read", "edit"] as const)(
    "routes inspected image content in %s",
    (context) => {
      expect(resolveImageContent(context, true)).toBe("open");
      expect(resolveImageContent(context, false)).toBe(
        context === "edit" ? "insert-images" : "reject-image",
      );
    },
  );
  it("rejects unsupported types", () => {
    expect(resolveDrop({ paths: ["/a.pdf"], context: "library" })).toMatchObject({
      action: "unsupported",
      label: "unsupported",
    });
  });
});

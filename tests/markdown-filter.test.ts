import { describe, expect, it } from "vitest";
import { filterByKind } from "../src/features/library/model";
import type { LibraryItem } from "../src/features/library/types";

describe("library markdown filter", () => {
  it("separates canvas and manuscript cards", () => {
    const item = (kind: LibraryItem["kind"]): LibraryItem => ({
      id: kind,
      path: null,
      name: kind,
      kind,
      time: 0,
      count: 0,
      bg: "",
      mtime: 0,
      section: "draft",
    });
    const items = [item("markdown"), item("excalidraw")];
    expect(filterByKind(items, "all")).toHaveLength(2);
    expect(filterByKind(items, "markdown")).toEqual([items[0]]);
    expect(filterByKind(items, "canvas")).toEqual([items[1]]);
  });
});

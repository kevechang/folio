import { describe, expect, it } from "vitest";
import { filterByName, mergeMissing, sortDrafts } from "../src/features/library/model";
import type { Recent, Draft } from "../src/lib/persistence";

const recent = (id: string): Recent => ({
  id,
  path: id,
  name: id,
  kind: "excalidraw",
  lastOpenedAt: 1,
  mtime: 1,
  elementCount: 0,
  bg: "#fff",
});
const draft = (id: string, updatedAt: number): Draft => ({ id, name: id, updatedAt, json: "{}" });

describe("library lists", () => {
  it("merges stat results without reordering recents", () => {
    expect(
      mergeMissing([recent("a"), recent("b")], [{ mtime: 1, size: 1 }, null]).map((item) => [
        item.id,
        item.missing,
      ]),
    ).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });
  it("sorts drafts newest first without mutating input", () => {
    const input = [draft("old", 1), draft("new", 2)];
    expect(sortDrafts(input).map((item) => item.id)).toEqual(["new", "old"]);
    expect(input[0].id).toBe("old");
  });
  it("filters current section by case insensitive name", () => {
    expect(filterByName([{ name: "Design" }, { name: "notes" }], "SIGN")).toEqual([
      { name: "Design" },
    ]);
  });
});

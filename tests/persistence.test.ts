import { describe, expect, it } from "vitest";
import { removeRecent, upsertRecent, type Recent } from "../src/lib/persistence";

function recent(id: number): Recent {
  return {
    id: String(id),
    path: String(id),
    name: String(id),
    kind: "excalidraw",
    lastOpenedAt: id,
    mtime: 0,
    elementCount: 0,
    bg: "#fff",
  };
}

describe("recents", () => {
  it("moves an existing path to the front without duplicating it", () => {
    const updated = upsertRecent([recent(1), recent(2), recent(3)], recent(2));
    expect(updated.map((item) => item.id)).toEqual(["2", "1", "3"]);
  });

  it("caps at 50 and deletes by id", () => {
    const initial = Array.from({ length: 50 }, (_, index) => recent(index));
    const updated = upsertRecent(initial, recent(50));
    expect(updated).toHaveLength(50);
    expect(updated[0].id).toBe("50");
    expect(updated.some((item) => item.id === "49")).toBe(false);
    expect(removeRecent(updated, "50")).toHaveLength(49);
  });
});

import { describe, expect, it } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { clampFramePage, orderFrames } from "../src/lib/frames";

function frame(id: string, x: number, y: number, height = 100, type = "frame", isDeleted = false) {
  return { id, x, y, height, width: 100, type, isDeleted } as ExcalidrawElement;
}

describe("orderFrames", () => {
  it("groups rows then sorts each row left to right", () => {
    const items = [frame("b", 200, 10), frame("c", 0, 200), frame("a", 0, 0)];
    expect(orderFrames(items).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
  it("uses the smaller frame height and strict half-height threshold", () => {
    const items = [frame("low", 0, 49, 100), frame("high", 200, 0, 80)];
    expect(orderFrames(items).map((item) => item.id)).toEqual(["high", "low"]);
    expect(orderFrames([frame("a", 100, 0), frame("b", 0, 50)]).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);
  });
  it("includes magic frames but excludes deleted elements", () => {
    expect(
      orderFrames([
        frame("deleted", 0, 0, 100, "frame", true),
        frame("magic", 1, 1, 100, "magicframe"),
      ]).map((item) => item.id),
    ).toEqual(["magic"]);
  });
});

describe("clampFramePage", () => {
  it("clamps both boundaries including empty lists", () => {
    expect(clampFramePage(-1, 3)).toBe(0);
    expect(clampFramePage(8, 3)).toBe(2);
    expect(clampFramePage(2, 0)).toBe(0);
  });
});

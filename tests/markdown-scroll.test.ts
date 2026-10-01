import { describe, expect, it } from "vitest";
import { scrollSpyIndex } from "../src/lib/markdown";

describe("markdown scroll spy", () => {
  it("selects the last heading above the reading threshold", () => {
    expect(scrollSpyIndex([-500, 80, 400])).toBe(1);
    expect(scrollSpyIndex([180, 400])).toBe(0);
    expect(scrollSpyIndex([])).toBe(0);
  });
});

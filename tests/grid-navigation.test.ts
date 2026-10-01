import { expect, it } from "vitest";
import { gridNextIndex } from "../src/features/library/model";

it("moves focus by grid columns and clamps at ends", () => {
  expect(gridNextIndex(1, 3, 8, "ArrowDown")).toBe(4);
  expect(gridNextIndex(4, 3, 8, "ArrowUp")).toBe(1);
  expect(gridNextIndex(0, 3, 8, "ArrowLeft")).toBe(0);
  expect(gridNextIndex(7, 3, 8, "ArrowRight")).toBe(7);
});

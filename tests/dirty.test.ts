import { expect, it } from "vitest";
import { updateBaseline, draftCloseAction } from "../src/features/document/dirty";

it("uses first new canvas change as baseline, then detects actual edits", () => {
  const first = updateBaseline("", "empty-scene", true);
  expect(first).toEqual({ baseline: "empty-scene", dirty: false });
  expect(updateBaseline(first.baseline, "empty-scene", true).dirty).toBe(false);
  expect(updateBaseline(first.baseline, "with-stroke", true).dirty).toBe(true);
});

it("deletes untouched new drafts and keeps restored drafts", () => {
  expect(draftCloseAction(false, false)).toBe("delete");
  expect(draftCloseAction(false, true)).toBe("keep");
  expect(draftCloseAction(true, false)).toBe("persist");
});

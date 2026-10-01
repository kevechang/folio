import { expect, it } from "vitest";
import { alignedScroll, sourceHeadingAnchors } from "../src/features/markdown/useScrollSync";

it("maps scroll positions between source and preview heading anchors", () => {
  const source = [
    { key: "起点", top: 100 },
    { key: "终点", top: 500 },
  ];
  const preview = [
    { key: "起点", top: 200 },
    { key: "终点", top: 1000 },
  ];
  expect(alignedScroll(300, source, preview, 1500)).toBe(600);
  expect(alignedScroll(600, preview, source, 900)).toBe(300);
});

it("derives source anchors from Markdown heading lines without Penna source positions", () => {
  expect(sourceHeadingAnchors("# 起点\n正文\n## 终点", 600)).toEqual([
    { key: "起点", top: 0 },
    { key: "终点", top: 600 },
  ]);
});

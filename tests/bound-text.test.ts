import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { LatestScene } from "../src/features/document/types";
import { inferBoundTextAlign } from "../src/lib/bound-text";

const container = (type = "rectangle") => ({
  id: "box",
  type,
  x: 100,
  y: 160,
  width: 200,
  height: 96,
  boundElements: [
    { id: "text", type: "text" },
    { id: "other", type: "arrow" },
  ],
  groupIds: ["outer"],
  version: 3,
  versionNonce: 30,
  isDeleted: false,
});
const text = (x: number, y: number) => ({
  id: "text",
  type: "text",
  containerId: "box",
  x,
  y,
  width: 160,
  height: 26,
  text: "绑定文字",
  fontSize: 20,
  textAlign: "center",
  verticalAlign: "top",
  autoResize: false,
  groupIds: ["outer"],
  version: 7,
  versionNonce: 42,
  isDeleted: false,
});
const scene = (...elements: object[]) => elements as LatestScene["elements"];

describe("bound text alignment", () => {
  it.each([
    ["top", 165],
    ["middle", 195],
    ["bottom", 225],
  ] as const)("keeps exact %s placement bound", (align, y) => {
    const input = scene(container(), text(120, y));
    const result = inferBoundTextAlign(input);
    expect(result[0]).toBe(input[0]);
    expect(result[1]).toMatchObject({
      containerId: "box",
      verticalAlign: align,
      x: 120,
      y,
      version: 7,
      versionNonce: 42,
    });
    if (align === "top") expect(result[1]).toBe(input[1]);
    else expect(result[1]).not.toBe(input[1]);
  });

  it("detaches an offset text while preserving its exact geometry and outer groups", () => {
    const input = scene(container(), { ...text(113, 213), textAlign: "left" }, { id: "untouched" });
    const result = inferBoundTextAlign(input);
    const box = result[0];
    const label = result[1];
    expect(label).toMatchObject({
      containerId: null,
      x: 113,
      y: 213,
      width: 160,
      height: 26,
      text: "绑定文字",
      fontSize: 20,
      textAlign: "left",
      autoResize: false,
      version: 7,
      versionNonce: 42,
    });
    expect(box).toMatchObject({
      boundElements: [{ id: "other", type: "arrow" }],
      version: 3,
      versionNonce: 30,
    });
    expect(box.groupIds).toHaveLength(2);
    expect(box.groupIds[0]).toBe(label.groupIds[0]);
    expect(box.groupIds[1]).toBe("outer");
    expect(label.groupIds[1]).toBe("outer");
    expect(result[2]).toBe(input[2]);
  });

  it.each([
    [["A"], ["B"]],
    [
      ["inner", "outer"],
      ["outer", "inner"],
    ],
    [["outer"], []],
    [[], ["outer"]],
    [["outer"], ["outer", "parent"]],
  ])("keeps differing groupIds %j / %j bound and untouched", (boxGroups, textGroups) => {
    const label = { ...text(113, 213), groupIds: textGroups, index: "a0" };
    const box = { ...container(), groupIds: boxGroups, index: "a1" };
    const input = scene(label, box);
    const before = JSON.stringify(input);
    const result = inferBoundTextAlign(input);
    expect(result[0]).toBe(label);
    expect(result[1]).toBe(box);
    expect(JSON.stringify(result)).toBe(before);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("detaches texts whose groupIds are both empty", () => {
    const input = scene({ ...container(), groupIds: [] }, { ...text(113, 213), groupIds: [] });
    const result = inferBoundTextAlign(input);
    expect(result[1]).toMatchObject({ containerId: null });
    expect(result[0].groupIds).toHaveLength(1);
    expect(result[1].groupIds).toEqual(result[0].groupIds);
    expect(result[0].boundElements).toEqual([{ id: "other", type: "arrow" }]);
  });

  it("moves detached text above its solid container and keeps later text in place", () => {
    const first = { ...text(113, 213), id: "first", index: "a0" };
    const second = { ...text(113, 235), id: "second", index: "a1" };
    const box = {
      ...container(),
      index: "a2",
      backgroundColor: "#fff9db",
      fillStyle: "solid",
      boundElements: [
        { id: "first", type: "text" },
        { id: "second", type: "text" },
        { id: "later", type: "text" },
      ],
    };
    const later = { ...text(113, 245), id: "later", index: "a3" };
    const input = scene(first, second, box, later);
    const result = inferBoundTextAlign(input);

    expect(result.map((element) => element.id)).toEqual(["box", "first", "second", "later"]);
    expect(result[3]).toMatchObject({ id: "later", index: "a3", containerId: null });
    expect(result[0].index).toBe("a2");
    expect(
      result.every((element, index) => index === 0 || result[index - 1].index < element.index),
    ).toBe(true);
  });

  it.each([
    ["ellipse", 165 + (96 / 2) * (1 - Math.sqrt(2) / 2)],
    ["diamond", 189],
  ] as const)("uses Excalidraw's %s inset", (shape, y) => {
    const x = shape === "ellipse" ? 105 + (200 / 2) * (1 - Math.sqrt(2) / 2) : 155;
    const width = shape === "ellipse" ? Math.round(100 * Math.sqrt(2)) - 10 : 90;
    const label = { ...text(x + (width - 160) / 2, y), verticalAlign: "bottom" };
    const input = scene(container(shape), label);
    const result = inferBoundTextAlign(input);
    expect(result[0]).toBe(input[0]);
    expect(result[1]).toMatchObject({ containerId: "box", verticalAlign: "top" });
  });

  it("ignores arrow labels, deleted containers, and missing containers", () => {
    const arrow = { ...container("arrow"), id: "arrow" };
    const arrowText = { ...text(113, 213), id: "arrow-text", containerId: "arrow" };
    const deleted = { ...container(), isDeleted: true };
    const missingText = { ...text(113, 213), id: "missing", containerId: "missing-box" };
    const input = scene(arrow, arrowText, deleted, text(113, 213), missingText);
    const result = inferBoundTextAlign(input);
    result.forEach((element, index) => expect(element).toBe(input[index]));
  });

  it("orders detached synthetic notes above their boxes while preserving compatible bindings", () => {
    const fixturePath = new URL("./fixtures/padded-plain-notes.excalidraw", import.meta.url);
    const elements = JSON.parse(readFileSync(fixturePath, "utf8"))
      .elements as LatestScene["elements"];
    const result = inferBoundTextAlign(elements);
    const positions = new Map(result.map((element, index) => [element.id, index]));
    const labels = result.filter((element) => element.id.endsWith("_plain_text"));
    expect(labels).toHaveLength(3);
    for (const label of labels) {
      const boxId = label.id.replace(/_plain_text$/, "_plain_box");
      expect(label).toMatchObject({ containerId: null });
      expect(positions.get(label.id)!).toBeGreaterThan(positions.get(boxId)!);
    }
    const indices = result.map((element) => element.index).filter(Boolean);
    expect(indices).toHaveLength(result.length);
    expect(
      indices.every((index, position) => position === 0 || indices[position - 1] < index),
    ).toBe(true);
    expect(result.find((element) => element.id === "cross_group_text")).toMatchObject({
      containerId: "cross_group_box",
    });
    expect(result.find((element) => element.id === "aligned_text")).toMatchObject({
      containerId: "aligned_box",
    });
  });
});

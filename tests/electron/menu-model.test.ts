// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { COMMAND_DEFINITIONS, createCommandRegistry } from "../../src/lib/commands";
import { createMenuModel } from "../../src/lib/native-menu";

describe("menu model", () => {
  it("serializes all five menus with only clipboard roles in Edit", () => {
    const model = createMenuModel(
      createCommandRegistry(() => {}),
      {
        hasDocument: true,
        dirty: true,
        hasPath: true,
        mode: "edit",
        theme: "system",
        autoSave: true,
      },
    );
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
    expect(model.map((menu) => menu.label)).toEqual(["Folio", "文件", "编辑", "显示", "窗口"]);
    expect(model[2].submenu?.map((item) => item.role)).toEqual(["cut", "copy", "paste"]);
    expect(JSON.stringify(model[2])).not.toMatch(/undo|redo|selectAll/i);
    expect(model[1].submenu?.find((item) => item.id === "save")?.accelerator).toBe(
      COMMAND_DEFINITIONS.save.accelerator,
    );
  });
  it("adds Format only while editing a markdown document", () => {
    const state = {
      hasDocument: true,
      dirty: false,
      hasPath: true,
      mode: "edit" as const,
      theme: "system" as const,
      autoSave: true,
      documentKind: "markdown" as const,
    };
    const commands = createCommandRegistry(() => {});
    const menu = createMenuModel(commands, state);
    const file = menu.find((entry) => entry.label === "文件");
    expect(
      file?.submenu
        ?.filter((entry) => ["exportPdf", "exportHtml", "copyWechat"].includes(entry.id ?? ""))
        .map((entry) => entry.enabled),
    ).toEqual([true, true, true]);
    expect(file?.submenu?.some((entry) => entry.id === "exportPng")).toBe(false);
    const format = menu.find((entry) => entry.label === "格式");
    expect(format?.submenu?.find((entry) => entry.id === "format:bold")?.accelerator).toBe(
      "CmdOrCtrl+B",
    );
    expect(
      createMenuModel(commands, { ...state, mode: "read" }).some((entry) => entry.label === "格式"),
    ).toBe(false);
  });
});

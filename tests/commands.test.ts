import { describe, expect, it } from "vitest";
import { createDeduper, keyCommand, COMMAND_DEFINITIONS } from "../src/lib/commands";

describe("command de-duplication", () => {
  it("accepts at 150ms and rejects inside the window", () => {
    const allow = createDeduper(150);
    expect(allow("save", 1000)).toBe(true);
    expect(allow("save", 1149)).toBe(false);
    expect(allow("save", 1150)).toBe(true);
    expect(allow("open", 1149)).toBe(true);
  });
});

describe("shortcuts from the command table", () => {
  it("maps Command-Shift-S and Command-E", () => {
    expect(keyCommand({ key: "S", metaKey: true, shiftKey: true, altKey: false })).toBe("saveAs");
    expect(keyCommand({ key: "e", metaKey: true, shiftKey: false, altKey: false })).toBe("edit");
    expect(COMMAND_DEFINITIONS.edit.accelerator).toBe("CmdOrCtrl+E");
  });

  it("ignores unrelated modifiers", () => {
    expect(keyCommand({ key: "s", metaKey: true, shiftKey: false, altKey: true })).toBeNull();
  });
});

describe("markdown exports", () => {
  it("enables document exports only for markdown", () => {
    const state = {
      hasDocument: true,
      dirty: false,
      hasPath: true,
      mode: "read" as const,
      theme: "light" as const,
      autoSave: true,
      documentKind: "markdown" as const,
    };
    for (const id of ["exportHtml", "exportPdf", "copyWechat"] as const) {
      expect(COMMAND_DEFINITIONS[id].enabled(state)).toBe(true);
      expect(COMMAND_DEFINITIONS[id].enabled({ ...state, documentKind: "canvas" })).toBe(false);
      expect(COMMAND_DEFINITIONS[id].enabled({ ...state, hasDocument: false })).toBe(false);
    }
  });
});

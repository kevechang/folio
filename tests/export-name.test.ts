import { describe, expect, it } from "vitest";
import { exportFilename } from "../src/lib/export-name";

describe("exportFilename", () => {
  it("adds the requested extension and replaces illegal characters", () => {
    expect(exportFilename("work.excalidraw", "png")).toBe("work.png");
    expect(exportFilename("a/b:c?.svg", "svg")).toBe("a_b_c_.svg");
    expect(exportFilename("  ", "png")).toBe("未命名画布.png");
  });
});

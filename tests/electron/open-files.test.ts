import { describe, expect, it } from "vitest";
import { createOpenFiles } from "../../electron/main/open-files";

describe("open files", () => {
  it("queues before ready and sends directly after ready", () => {
    const sent: string[][] = [];
    const files = createOpenFiles(
      (paths) => sent.push(paths),
      () => {},
    );
    files.receive(["a.excalidraw"]);
    expect(sent).toEqual([]);
    expect(files.takePending()).toEqual(["a.excalidraw"]);
    files.receive(["b.excalidraw"]);
    expect(sent).toEqual([["b.excalidraw"]]);
  });
  it("passes a second instance's files and focuses the window", () => {
    const sent: string[][] = [];
    let focused = 0;
    const files = createOpenFiles(
      (paths) => sent.push(paths),
      () => focused++,
    );
    files.takePending();
    files.secondInstance(["/tmp/画布.excalidraw", "--flag"]);
    expect(sent).toEqual([["/tmp/画布.excalidraw"]]);
    expect(focused).toBe(1);
  });
});

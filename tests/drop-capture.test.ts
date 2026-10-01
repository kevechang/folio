// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { captureFileDrops } from "../src/lib/platform/electron";

describe("Electron file drop capture", () => {
  it("stops files before children and handles nested enter/leave", () => {
    Object.assign(window, { folio: { getPathForFile: (file: File) => `/tmp/${file.name}` } });
    const child = document.createElement("div");
    document.body.append(child);
    const received: string[] = [];
    const lower: string[] = [];
    child.addEventListener("drop", () => lower.push("drop"));
    const stop = captureFileDrops((event) => received.push(event.type));
    const fire = (type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
      Object.defineProperty(event, "dataTransfer", {
        value: {
          types: ["Files"],
          files: [new File(["x"], "a.excalidraw")],
        },
      });
      child.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    };
    fire("dragenter");
    fire("dragenter");
    fire("dragleave");
    expect(received).toEqual(["enter"]);
    fire("dragleave");
    fire("drop");
    expect(received).toEqual(["enter", "leave", "drop"]);
    expect(lower).toEqual([]);
    stop();
    child.remove();
  });
});

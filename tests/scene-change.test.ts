import { describe, expect, it, vi } from "vitest";
import { shouldCheckScene, type SceneCheck } from "../src/features/document/scene-change";

describe("scene change scheduling", () => {
  it("skips viewport-only changes and schedules changed elements", () => {
    const schedule = vi.fn();
    const elements = [] as SceneCheck["elements"];
    const files = {} as SceneCheck["files"];
    let previous: SceneCheck | null = null;
    const onChange = (current: SceneCheck) => {
      if (!shouldCheckScene(previous, current)) return;
      previous = current;
      schedule();
    };

    const scene = { elements, files, viewBackgroundColor: "#fff", gridSize: 20 };
    onChange(scene);
    onChange({ ...scene });
    expect(schedule).toHaveBeenCalledTimes(1);
    onChange({ ...scene, elements: [...elements] });
    expect(schedule).toHaveBeenCalledTimes(2);
  });
});

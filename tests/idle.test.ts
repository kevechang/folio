import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleIdle } from "../src/lib/idle";

describe("idle fallback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it("runs after delay when requestIdleCallback is missing", () => {
    vi.useFakeTimers();
    const task = vi.fn();
    scheduleIdle(task, 15);
    vi.advanceTimersByTime(14);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    vi.runAllTimers();
    expect(task).toHaveBeenCalledOnce();
  });
  it("cancels pending fallback", () => {
    vi.useFakeTimers();
    const task = vi.fn();
    const cancel = scheduleIdle(task, 15);
    cancel();
    vi.runAllTimers();
    expect(task).not.toHaveBeenCalled();
  });
});

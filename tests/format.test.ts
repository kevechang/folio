import { describe, expect, it } from "vitest";
import { middleEllipsis, relativeTime } from "../src/lib/format";

const now = new Date(2026, 8, 23, 12, 0).getTime();

describe("relativeTime", () => {
  it("formats just now, minutes, and hours", () => {
    expect(relativeTime(now - 1000, now)).toBe("刚刚");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5 分钟前");
    expect(relativeTime(now - 2 * 3_600_000, now)).toBe("2 小时前");
  });

  it("formats yesterday, same year, and a different year", () => {
    expect(relativeTime(new Date(2026, 8, 22, 8, 5).getTime(), now)).toBe("昨天 08:05");
    expect(relativeTime(new Date(2026, 1, 2).getTime(), now)).toBe("2月2日");
    expect(relativeTime(new Date(2025, 1, 2).getTime(), now)).toBe("2025年2月2日");
  });
});

describe("middleEllipsis", () => {
  it("preserves both ends and handles short paths", () => {
    expect(middleEllipsis("/Users/example/a.excalidraw", 15)).toMatch(/^\/Users\/.*….*draw$/);
    expect(middleEllipsis("/a", 15)).toBe("/a");
    expect(middleEllipsis("abcdef", 1)).toBe("…");
  });
});

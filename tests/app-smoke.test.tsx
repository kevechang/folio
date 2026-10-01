// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = Observer;
  window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  Object.defineProperty(window, "indexedDB", { configurable: true, value: undefined });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "folio");
});

describe("app startup", () => {
  it("mounts the recent library on the web platform", async () => {
    const { default: App } = await import("../src/App");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "最近打开" })).toBeTruthy();
  });

  it("resolves the Electron platform module within two seconds", async () => {
    vi.resetModules();
    Object.defineProperty(window, "folio", { configurable: true, value: {} });
    const imported = await Promise.race([
      import("../src/lib/platform"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("platform import timed out")), 2000),
      ),
    ]);
    const { default: electronPlatform } = await import("../src/lib/platform/electron");
    expect(imported.platform).toBe(electronPlatform);
  });
});

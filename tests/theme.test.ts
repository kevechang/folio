// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppTheme } from "../src/features/shell/useAppTheme";

const mock = vi.hoisted(() => ({
  setThemeOverride: vi.fn<(_theme: "light" | "dark" | null) => Promise<void>>(),
  getSystemTheme: vi.fn<() => Promise<"light" | "dark">>(),
  onSystemThemeChanged: vi.fn(),
  changed: null as null | ((theme: "light" | "dark") => void),
}));

vi.mock("../src/lib/platform", () => ({ platform: mock }));

const syncMenu = () => {};

function Harness() {
  const { setting, theme, changeTheme } = useAppTheme(syncMenu);
  return createElement(
    "div",
    null,
    createElement("span", { "data-testid": "setting" }, setting),
    createElement("span", { "data-testid": "theme" }, theme),
    createElement("button", { onClick: () => changeTheme("system") }, "system"),
    createElement("button", { onClick: () => changeTheme("light") }, "light"),
    createElement("button", { onClick: () => changeTheme("dark") }, "dark"),
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themeSwitching;
  mock.changed = null;
  mock.setThemeOverride.mockReset().mockResolvedValue(undefined);
  mock.getSystemTheme.mockReset().mockResolvedValue("dark");
  mock.onSystemThemeChanged.mockReset().mockImplementation(async (cb) => {
    mock.changed = cb;
    return () => {
      mock.changed = null;
    };
  });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("app theme", () => {
  it("unlocks the window before reading the system appearance at startup", async () => {
    render(createElement(Harness));
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    expect(mock.setThemeOverride).toHaveBeenCalledWith(null);
    expect(mock.getSystemTheme).toHaveBeenCalledOnce();
    expect(mock.setThemeOverride.mock.invocationCallOrder[0]).toBeLessThan(
      mock.getSystemTheme.mock.invocationCallOrder[0],
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("responds to system changes only while following the system", async () => {
    render(createElement(Harness));
    await waitFor(() => expect(mock.changed).not.toBeNull());
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    act(() => mock.changed?.("light"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    await act(async () => screen.getByText("dark").click());
    await waitFor(() => expect(mock.setThemeOverride).toHaveBeenLastCalledWith("dark"));
    act(() => mock.changed?.("light"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    await act(async () => screen.getByText("light").click());
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("light"));
    act(() => mock.changed?.("dark"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("releases a dark override before returning to the current system appearance", async () => {
    mock.getSystemTheme.mockResolvedValue("light");
    render(createElement(Harness));
    await waitFor(() => expect(mock.changed).not.toBeNull());
    await act(async () => screen.getByText("dark").click());
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    mock.setThemeOverride.mockClear();
    mock.getSystemTheme.mockClear();
    await act(async () => screen.getByText("system").click());
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("light"));
    expect(mock.setThemeOverride).toHaveBeenCalledWith(null);
    expect(mock.getSystemTheme).toHaveBeenCalledOnce();
    expect(mock.setThemeOverride.mock.invocationCallOrder[0]).toBeLessThan(
      mock.getSystemTheme.mock.invocationCallOrder[0],
    );
    expect(screen.getByTestId("setting").textContent).toBe("system");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("keeps the color transition active for 260ms after a manual switch", async () => {
    render(createElement(Harness));
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    vi.useFakeTimers();
    await act(async () => {
      screen.getByText("light").click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(true);
    act(() => vi.advanceTimersByTime(259));
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(false);
  });

  it("uses the same transition when the system appearance changes", async () => {
    render(createElement(Harness));
    await waitFor(() => expect(mock.changed).not.toBeNull());
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    vi.useFakeTimers();
    act(() => mock.changed?.("light"));
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(true);
    act(() => vi.advanceTimersByTime(260));
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(false);
  });

  it("switches immediately when reduced motion is requested", async () => {
    render(createElement(Harness));
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
    }));
    await act(async () => {
      screen.getByText("light").click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.hasAttribute("data-theme-switching")).toBe(false);
  });
});

// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSetting } from "../src/lib/settings";
import { useSetting } from "../src/lib/useSetting";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("settings", () => {
  it("uses the large text scale and enables autosave by default", () => {
    expect(DEFAULT_SETTINGS.textScale).toBe("large");
    expect(DEFAULT_SETTINGS.autosave).toBe(true);
    expect(DEFAULT_SETTINGS.mdReadingWidth).toBe("standard");
    expect(DEFAULT_SETTINGS.mdEditLayout).toBe("split");
    expect(DEFAULT_SETTINGS.mdImageStorage).toBe("local");
    const scale = renderHook(() => useSetting("textScale"));
    const autosave = renderHook(() => useSetting("autosave"));
    expect(scale.result.current[0]).toBe("large");
    expect(autosave.result.current[0]).toBe(true);
    expect(renderHook(() => useSetting("mdReadingWidth")).result.current[0]).toBe("standard");
  });

  it("falls back for invalid stored values", () => {
    localStorage.setItem("folio-textScale", "huge");
    localStorage.setItem("folio-autosave", "maybe");
    localStorage.setItem("folio-theme", "blue");
    localStorage.setItem("folio-mdReadingWidth", "extra-wide");
    localStorage.setItem("folio-mdEditLayout", "preview");
    localStorage.setItem("folio-mdImageStorage", "shell");
    expect(renderHook(() => useSetting("textScale")).result.current[0]).toBe("large");
    expect(renderHook(() => useSetting("autosave")).result.current[0]).toBe(true);
    expect(parseSetting("theme", localStorage.getItem("folio-theme"))).toBe("system");
    expect(renderHook(() => useSetting("mdReadingWidth")).result.current[0]).toBe("standard");
    expect(renderHook(() => useSetting("mdEditLayout")).result.current[0]).toBe("split");
    expect(renderHook(() => useSetting("mdImageStorage")).result.current[0]).toBe("local");
  });

  it("parses the new keys and migrates the old layout key once", () => {
    localStorage.setItem("folio-md-layout", "edit");
    expect(renderHook(() => useSetting("mdEditLayout")).result.current[0]).toBe("edit");
    expect(localStorage.getItem("folio-mdEditLayout")).toBe("edit");
    expect(localStorage.getItem("folio-md-layout")).toBeNull();
    localStorage.setItem("folio-mdImageStorage", "upic");
    localStorage.setItem("folio-mdPicgoUrl", "http://localhost:36677");
    localStorage.setItem("folio-mdUpicPath", "/tmp/uPic");
    expect(parseSetting("mdImageStorage", localStorage.getItem("folio-mdImageStorage"))).toBe(
      "upic",
    );
    expect(parseSetting("mdPicgoUrl", localStorage.getItem("folio-mdPicgoUrl"))).toBe(
      "http://localhost:36677",
    );
    expect(parseSetting("mdUpicPath", localStorage.getItem("folio-mdUpicPath"))).toBe("/tmp/uPic");
  });

  it("synchronizes two subscribers to the same key", () => {
    const first = renderHook(() => useSetting("autosave"));
    const second = renderHook(() => useSetting("autosave"));
    act(() => first.result.current[1](false));
    expect(first.result.current[0]).toBe(false);
    expect(second.result.current[0]).toBe(false);
    expect(localStorage.getItem("folio-autosave")).toBe("false");
    act(() => second.result.current[1](true));
    expect(first.result.current[0]).toBe(true);
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsSheet } from "../src/features/settings/SettingsSheet";

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = vi
    .fn()
    .mockImplementation(() => ({ matches: false, addEventListener: vi.fn() }));
});
afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty("--text-scale");
  document.documentElement.style.removeProperty("--folio-md-width");
});

describe("settings sheet", () => {
  it("shows all three settings and updates text scale and autosave", () => {
    render(<SettingsSheet open onOpenChange={() => {}} theme="system" onTheme={() => {}} />);
    expect(screen.getByText("主题")).toBeTruthy();
    expect(screen.getByText("界面字号")).toBeTruthy();
    expect(screen.getByText("自动保存")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "大", pressed: false }));
    expect(document.documentElement.style.getPropertyValue("--text-scale")).toBe("1.25");
    expect(localStorage.getItem("folio-textScale")).toBe("xlarge");
    fireEvent.click(screen.getByRole("switch", { name: "自动保存" }));
    expect(localStorage.getItem("folio-autosave")).toBe("false");
  });

  it("updates the Markdown width for each segment", () => {
    render(<SettingsSheet open onOpenChange={() => {}} theme="system" onTheme={() => {}} />);
    expect(screen.getByText("文稿")).toBeTruthy();
    expect(screen.getByText("调整 Markdown 正文栏的最大宽度")).toBeTruthy();
    for (const [label, value, pixels] of [
      ["窄", "narrow", "640px"],
      ["宽", "wide", "860px"],
      ["标准", "standard", "720px"],
    ] as const) {
      fireEvent.click(
        screen.getByRole("group", { name: "阅读宽度" }).querySelector(`[aria-label="${label}"]`)!,
      );
      expect(localStorage.getItem("folio-mdReadingWidth")).toBe(value);
      expect(document.documentElement.style.getPropertyValue("--folio-md-width")).toBe(pixels);
    }
  });

  it("shows upload settings only for the selected service", () => {
    render(<SettingsSheet open onOpenChange={() => {}} theme="system" onTheme={() => {}} />);
    expect(screen.getByText("粘贴的图片存到文稿旁的 assets 文件夹")).toBeTruthy();
    expect(screen.queryByLabelText("PicGo 服务地址")).toBeNull();
    expect(screen.queryByLabelText("uPic 路径")).toBeNull();
    fireEvent.change(screen.getByLabelText("图片保存"), { target: { value: "picgo" } });
    expect(screen.getByText("上传到 PicGo 图床（需要 PicGo 正在运行）")).toBeTruthy();
    expect(screen.getByLabelText("PicGo 服务地址")).toBeTruthy();
    expect(screen.queryByLabelText("uPic 路径")).toBeNull();
    fireEvent.change(screen.getByLabelText("图片保存"), { target: { value: "upic" } });
    expect(screen.getByText("用 uPic 上传")).toBeTruthy();
    expect(screen.getByLabelText("uPic 路径")).toBeTruthy();
    expect(screen.queryByLabelText("PicGo 服务地址")).toBeNull();
  });
});

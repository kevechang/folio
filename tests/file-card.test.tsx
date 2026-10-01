// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FileCard } from "../src/features/library/components/FileCard";
import type { LibraryItem } from "../src/features/library/types";

vi.mock("../src/lib/thumbnails", () => ({
  readThumbnailRecord: vi.fn().mockResolvedValue(null),
  generateThumbnail: vi.fn(),
}));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  class Observer {
    observe() {}
    disconnect() {}
  }
  window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

afterEach(cleanup);

const base: LibraryItem = {
  id: "sample",
  path: null,
  name: "测试画布",
  kind: "draft",
  time: 1,
  count: 0,
  bg: "#fff",
  mtime: 1,
  section: "draft",
};

async function choose(label: string) {
  fireEvent.pointerDown(screen.getByRole("button", { name: "更多操作" }), {
    button: 0,
    ctrlKey: false,
    pointerType: "mouse",
  });
  fireEvent.click(await screen.findByRole("menuitem", { name: label }));
}

describe("file card actions", () => {
  it("keeps the draft closed through delete confirmation and cancel", async () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    render(<FileCard item={base} index={0} onOpen={onOpen} onRemove={onRemove} />);
    await choose("删除草稿…");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onOpen).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await choose("删除草稿…");
    fireEvent.click(screen.getByRole("button", { name: "删除草稿" }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("removes a recent entry without opening it", async () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    render(
      <FileCard
        item={{ ...base, section: "recent", kind: "excalidraw", path: "/tmp/test.excalidraw" }}
        index={0}
        onOpen={onOpen}
        onRemove={onRemove}
      />,
    );
    await choose("从「最近」中移除");
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("opens the card itself once", () => {
    const onOpen = vi.fn();
    render(<FileCard item={base} index={0} onOpen={onOpen} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "测试画布" }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

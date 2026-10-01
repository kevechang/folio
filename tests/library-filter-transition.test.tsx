// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FileGrid } from "../src/features/library/components/FileGrid";
import type { LibraryItem } from "../src/features/library/types";

vi.mock("../src/lib/thumbnails", () => ({
  readThumbnailRecord: vi.fn().mockResolvedValue(null),
  generateThumbnail: vi.fn(),
}));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  class Observer {
    observe() {}
    disconnect() {}
  }
  window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
});
afterEach(cleanup);

const item: LibraryItem = {
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

describe("library filter transition", () => {
  it("keeps only the entering grid or empty state in flow", async () => {
    const props = { onOpen: vi.fn(), onRemove: vi.fn(), pulseId: null };
    const view = render(<FileGrid {...props} items={[item]} filterKey="all" />);
    view.rerender(<FileGrid {...props} items={[item]} filterKey="canvas" />);
    await waitFor(() => {
      const panels = Array.from(
        view.container.querySelectorAll<HTMLElement>(".library-grid-panel"),
      );
      expect(panels.length).toBeGreaterThan(0);
      expect(
        panels.filter((panel) => getComputedStyle(panel).position !== "absolute"),
      ).toHaveLength(1);
    });
    view.rerender(
      <FileGrid {...props} items={[]} filterKey="markdown" emptyState={<div>没有文稿</div>} />,
    );
    await waitFor(() => {
      const panels = Array.from(
        view.container.querySelectorAll<HTMLElement>(".library-grid-panel"),
      );
      expect(
        panels.filter((panel) => getComputedStyle(panel).position !== "absolute"),
      ).toHaveLength(1);
      expect(view.getByText("没有文稿")).toBeTruthy();
    });
  });
});

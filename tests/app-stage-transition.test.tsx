// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let currentDocument: { id: string; name: string; kind: "markdown" } | null = {
  id: "closing-document",
  name: "刚关闭的文稿",
  kind: "markdown",
};
let switchingDocument = false;

vi.mock("../src/features/shell/useDocumentManager", () => ({
  useDocumentManager: () => ({
    doc: currentDocument,
    switchingDocument,
    finishDocumentEntry: () => {},
    actions: { current: null },
    docRef: { current: currentDocument },
    statusRef: { current: null },
    recents: [],
    librarySection: "recent",
    restoreScroll: { current: 0 },
  }),
}));
vi.mock("../src/features/shell/useDocumentTransition", () => ({
  useDocumentTransition: () => ({ ready: true, transitionThumb: null, pulseId: null }),
}));
vi.mock("../src/features/shell/useAppTheme", () => ({
  useAppTheme: () => ({ setting: "system", theme: "light", settingRef: { current: null } }),
}));
vi.mock("../src/features/shell/useAppCommands", () => ({ useAppCommands: () => {} }));
vi.mock("../src/features/shell/useDropHandler", () => ({ useDropHandler: () => null }));
vi.mock("../src/lib/useSetting", () => ({ useSetting: () => ["normal"] }));
vi.mock("../src/features/document/DocumentShell", () => ({
  default: ({ document }: { document: { name: string } }) => <header>{document.name}</header>,
}));
vi.mock("../src/features/library/LibraryView", () => ({
  default: () => <div>资料库</div>,
}));
vi.mock("../src/features/settings/SettingsSheet", () => ({ SettingsSheet: () => null }));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const style = document.createElement("style");
  style.textContent = readFileSync(resolve("src/styles/shell.css"), "utf8");
  document.head.append(style);
});

afterEach(() => {
  cleanup();
  currentDocument = { id: "closing-document", name: "刚关闭的文稿", kind: "markdown" };
  switchingDocument = false;
});

describe("app stage transition", () => {
  it("removes the closed document immediately and shows an opaque library stage", async () => {
    const { default: App } = await import("../src/App");
    const view = render(<App />);
    await waitFor(() => expect(view.getByText("刚关闭的文稿")).toBeTruthy());

    currentDocument = null;
    view.rerender(<App />);

    const documentStage = view.container.querySelector<HTMLElement>(".folio-document-stage");
    const libraryStage = view.container.querySelector<HTMLElement>(".folio-library-stage");
    expect(documentStage).toBeNull();
    expect(view.queryByText("刚关闭的文稿")).toBeNull();
    expect(libraryStage).not.toBeNull();
    expect(libraryStage!.style.opacity).not.toBe("0");
    expect(getComputedStyle(libraryStage!).opacity).toBe("1");
  });

  it("switches documents through no library frame", async () => {
    const { default: App } = await import("../src/App");
    const view = render(<App />);
    await waitFor(() => expect(view.getByText("刚关闭的文稿")).toBeTruthy());

    currentDocument = null;
    switchingDocument = true;
    view.rerender(<App />);
    expect(view.container.querySelector(".folio-document-stage")).toBeNull();
    expect(view.container.querySelector(".folio-library-stage")).toBeNull();
    expect(view.queryByText("刚关闭的文稿")).toBeNull();
    expect(view.queryByText("正在打开画布…")).toBeNull();

    currentDocument = { id: "returned-document", name: "返回的文稿", kind: "markdown" };
    view.rerender(<App />);
    await waitFor(() => expect(view.getByText("返回的文稿")).toBeTruthy());
    expect(view.container.querySelector(".folio-document-stage")).not.toBeNull();
    expect(view.container.querySelector(".folio-library-stage")).toBeNull();
    expect(view.queryByText("刚关闭的文稿")).toBeNull();
  });
});

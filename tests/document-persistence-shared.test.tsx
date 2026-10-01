// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { DocumentAdapter } from "../src/lib/markdown";
import type { DocumentData } from "../src/features/document/types";

const write = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/platform", () => ({
  ConflictError: class ConflictError extends Error {},
  platform: { writeFileAtomic: write, stat: async () => ({ mtime: 2, size: 0 }) },
}));
import { ConflictError } from "../src/lib/platform";
import { useDocumentPersistence } from "../src/features/document/useDocumentPersistence";

beforeEach(() => {
  write.mockReset();
  write.mockResolvedValue({ mtime: 2 });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

for (const kind of ["canvas", "markdown"] as const) {
  it(`${kind} uses shared dirty, save and conflict behavior`, async () => {
    const adapter: DocumentAdapter<string> = {
      kind,
      extensions: [".test"],
      load: async (bytes) => new TextDecoder().decode(bytes),
      serialize: (value) => new TextEncoder().encode(value),
      fingerprint: (value) => value,
      empty: () => "",
    };
    const doc: DocumentData = {
      id: kind,
      name: `sample.${kind === "canvas" ? "excalidraw" : "md"}`,
      kind: kind === "canvas" ? "excalidraw" : "markdown",
      path: `/tmp/sample.${kind === "canvas" ? "excalidraw" : "md"}`,
      mtime: 1,
      initial: null,
      text: kind === "markdown" ? "base" : undefined,
    };
    const { result } = renderHook(() =>
      useDocumentPersistence(adapter, {
        doc,
        initial: "base",
        mode: "edit",
        autoSave: false,
        apply: () => {},
        onClose: () => {},
        onSaved: () => {},
        onMetadata: () => {},
        onRenamed: () => {},
        onToast: () => {},
        onCancelPending: () => {},
      }),
    );
    act(() => result.current.onChangeModel("edited"));
    expect(result.current.dirty).toBe(true);
    await act(async () => {
      expect(await result.current.save()).toBe(true);
    });
    expect(write).toHaveBeenCalledWith(doc.path, new TextEncoder().encode("edited"), 1);
    expect(result.current.dirty).toBe(false);
    act(() => result.current.onChangeModel("again"));
    write.mockRejectedValueOnce(new ConflictError());
    await act(async () => {
      expect(await result.current.save()).toBe(false);
    });
    expect(result.current.showConflict).toBe(true);
    expect(result.current.saveState).toBe("conflict");
  });
}

it("flushes the latest Markdown edit before closing even before the animation frame", async () => {
  vi.stubGlobal("requestAnimationFrame", () => 1);
  const adapter: DocumentAdapter<string> = {
    kind: "markdown",
    extensions: [".md"],
    load: async (bytes) => new TextDecoder().decode(bytes),
    serialize: (value) => new TextEncoder().encode(value),
    fingerprint: (value) => value,
    empty: () => "",
  };
  const doc: DocumentData = {
    id: "flush",
    name: "flush.md",
    kind: "markdown",
    path: "/tmp/flush.md",
    mtime: 1,
    initial: null,
    text: "base",
  };
  const onClose = vi.fn();
  const { result } = renderHook(() =>
    useDocumentPersistence(adapter, {
      doc,
      initial: "base",
      mode: "edit",
      autoSave: true,
      apply: () => {},
      onClose,
      onSaved: () => {},
      onMetadata: () => {},
      onRenamed: () => {},
      onToast: () => {},
      onCancelPending: () => {},
    }),
  );
  act(() => result.current.onChangeModel("last keystroke"));
  await act(async () => {
    await result.current.close();
  });
  expect(write).toHaveBeenCalledWith(doc.path, new TextEncoder().encode("last keystroke"), 1);
  expect(onClose).toHaveBeenCalledOnce();
});

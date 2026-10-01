import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BrowserWindow } from "electron";
import { installIpc } from "../../electron/main/ipc";

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
  roots: new Set<string>(),
}));
vi.mock("electron", () => ({
  ClipboardItem: class {},
  clipboard: {},
  dialog: {},
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) =>
      mocks.handlers.set(channel, handler),
  },
  nativeImage: {},
  shell: {},
}));
vi.mock("../../electron/main/asset-roots", () => ({
  authorizedAssetRoots: () => new Set(mocks.roots),
  allowDocumentAssets: vi.fn(),
  allowFolderAssets: vi.fn(),
  removeFolderAssets: vi.fn(),
}));
vi.mock("../../electron/main/menu", () => ({ installMenu: vi.fn() }));
vi.mock("../../electron/main/theme", () => ({
  installTheme: () => vi.fn(),
  currentTheme: vi.fn(),
}));
vi.mock("../../electron/main/upload", () => ({ uploadImage: vi.fn() }));
vi.mock("../../electron/main/pdf", () => ({ exportPdf: vi.fn() }));

describe("asset:read IPC", () => {
  let folder: string;
  let root: string;
  const mainFrame = {};
  const event = { senderFrame: mainFrame };

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), "folio-asset-read-"));
    root = join(folder, "docs");
    await mkdir(root);
    await writeFile(join(root, "image.png"), new Uint8Array([1, 2, 3]));
    await writeFile(join(root, "private.txt"), "private");
    await writeFile(join(folder, "outside.png"), "outside");
    await symlink(join(folder, "outside.png"), join(root, "escape.png"));
    mocks.roots.clear();
    mocks.roots.add(root);
    mocks.handlers.clear();
    installIpc(
      { webContents: { mainFrame } } as BrowserWindow,
      {} as Parameters<typeof installIpc>[1],
      {} as Parameters<typeof installIpc>[2],
    );
  });
  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it("reads an authorized image and checks the current roots for every request", async () => {
    const read = mocks.handlers.get("asset:read")!;
    const path = join(root, "image.png");
    expect(await read(event, path)).toEqual({ ok: true, value: Buffer.from([1, 2, 3]) });
    mocks.roots.clear();
    expect(await read(event, path)).toEqual({ ok: true, value: null });
  });
  it("rejects traversal, non-images, relative paths and symlinks escaping the root", async () => {
    const read = mocks.handlers.get("asset:read")!;
    for (const path of [
      `${root}/../outside.png`,
      join(root, "private.txt"),
      "image.png",
      join(root, "escape.png"),
    ])
      expect(await read(event, path)).toEqual({ ok: true, value: null });
  });
  it("keeps the existing mainFrame guard", async () => {
    await expect(
      mocks.handlers.get("asset:read")!({ senderFrame: {} }, join(root, "image.png")),
    ).rejects.toThrow("Invalid frame");
  });
  it("preserves generic file:read for files outside the asset authorization", async () => {
    const result = await mocks.handlers.get("file:read")!(event, join(folder, "outside.png"));
    expect(result).toEqual({ ok: true, value: Buffer.from("outside") });
  });
});

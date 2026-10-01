import { expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const state = vi.hoisted(() => ({ directory: "" }));
vi.mock("electron", () => ({ app: { getPath: () => state.directory } }));
import {
  allowDocumentAssets,
  allowFolderAssets,
  removeFolderAssets,
} from "../electron/main/asset-roots";

it("persists authorized roots in userData and revokes a removed library folder", async () => {
  const directory = await mkdtemp(join(tmpdir(), "folio-authorized-roots-"));
  state.directory = directory;
  try {
    allowDocumentAssets("/docs/open.md");
    allowFolderAssets("/library");
    let saved = JSON.parse(await readFile(join(directory, "authorized-asset-roots.json"), "utf8"));
    expect(saved).toEqual({ documents: ["/docs"], folders: ["/library"] });
    removeFolderAssets("/library");
    saved = JSON.parse(await readFile(join(directory, "authorized-asset-roots.json"), "utf8"));
    expect(saved).toEqual({ documents: ["/docs"], folders: [] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

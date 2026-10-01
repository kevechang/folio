import { describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const handlers = vi.hoisted(
  () => new Map<string, (request: { url: string }) => Promise<Response> | Response>(),
);
vi.mock("electron", () => ({
  app: { getAppPath: () => "/app" },
  net: { fetch: async () => new Response("image") },
  protocol: {
    registerSchemesAsPrivileged: () => {},
    handle: (scheme: string, handler: (request: { url: string }) => Promise<Response> | Response) =>
      handlers.set(scheme, handler),
  },
}));

import { allowFolderAssets, installProtocol } from "../electron/main/protocol";
import {
  allowDocumentAssets,
  authorizedAssetRoots,
  removeFolderAssets,
} from "../electron/main/asset-roots";

describe("folio-asset protocol", () => {
  it("tracks document and library authorizations independently", () => {
    allowDocumentAssets("/docs/open.md");
    allowFolderAssets("/library");
    expect(authorizedAssetRoots().has("/docs")).toBe(true);
    expect(authorizedAssetRoots().has("/library")).toBe(true);
    removeFolderAssets("/library");
    expect(authorizedAssetRoots().has("/library")).toBe(false);
    expect(authorizedAssetRoots().has("/docs")).toBe(true);
  });
  it("rejects traversal and non-image paths with 403", async () => {
    allowFolderAssets("/docs/book");
    installProtocol();
    const handle = handlers.get("folio-asset")!;
    expect((await handle({ url: "folio-asset://local/docs/book/../private.png" })).status).toBe(
      403,
    );
    expect((await handle({ url: "folio-asset://local/docs/book/page.html" })).status).toBe(403);
  });
  it("serves an image inside an allowed folder with an image MIME type", async () => {
    const folder = await mkdtemp(join(tmpdir(), "folio-asset-test-"));
    try {
      const file = join(folder, "image.svg");
      await writeFile(file, "<svg/>");
      allowFolderAssets(folder);
      installProtocol();
      const response = await handlers.get("folio-asset")!({ url: `folio-asset://local${file}` });
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
});

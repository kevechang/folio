import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isAllowedAsset, resolveAuthorizedAssetPath } from "../electron/main/asset-path";

describe("folio-asset path checks", () => {
  const roots = ["/docs/book"];
  it("accepts images in the document folder", () => {
    expect(isAllowedAsset("/docs/book/images/a.png", roots)).toBe(true);
    expect(isAllowedAsset("/docs/book/a.svg", roots)).toBe(true);
  });
  it("rejects traversal, sibling folders and non-images", () => {
    expect(isAllowedAsset("/docs/book/../secret.png", roots)).toBe(false);
    expect(isAllowedAsset("/docs/book-other/a.png", roots)).toBe(false);
    expect(isAllowedAsset("/docs/book/a.html", roots)).toBe(false);
  });
});

describe("authorized asset realpath checks", () => {
  let folder: string;
  let root: string;
  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), "folio-authorized-assets-"));
    root = join(folder, "docs");
    await mkdir(root);
    await writeFile(join(root, "image.png"), "image");
    await writeFile(join(root, "private.txt"), "private");
    await writeFile(join(folder, "outside.png"), "outside");
  });
  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it("returns the real path of an authorized image", async () => {
    const path = join(root, "image.png");
    expect(await resolveAuthorizedAssetPath(path, [root])).toBe(await realpath(path));
  });
  it("rejects relative paths, traversal outside the root, non-images and missing files", async () => {
    for (const path of [
      "image.png",
      `${root}/../outside.png`,
      join(root, "private.txt"),
      join(root, "missing.png"),
    ])
      expect(await resolveAuthorizedAssetPath(path, [root])).toBeNull();
  });
  it("rejects an image symlink pointing outside the authorized root", async () => {
    const link = join(root, "escape.png");
    await symlink(join(folder, "outside.png"), link);
    expect(await resolveAuthorizedAssetPath(link, [root])).toBeNull();
  });
  it("checks the real extension and supports a symlinked authorized root", async () => {
    const disguised = join(root, "disguised.png");
    await symlink(join(root, "private.txt"), disguised);
    expect(await resolveAuthorizedAssetPath(disguised, [root])).toBeNull();
    const alias = join(folder, "alias");
    await symlink(root, alias);
    expect(await resolveAuthorizedAssetPath(join(alias, "image.png"), [alias])).toBe(
      await realpath(join(root, "image.png")),
    );
  });
});

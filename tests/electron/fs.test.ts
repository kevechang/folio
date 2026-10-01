import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fileStat,
  listSceneFiles,
  renameSceneFile,
  writeFileAtomic,
} from "../../electron/main/ipc-fs";

const folders: string[] = [];
async function temp() {
  const dir = await mkdtemp(join(tmpdir(), "folio-test-"));
  folders.push(dir);
  return dir;
}
afterEach(async () => {
  await Promise.all(folders.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
describe("main process files", () => {
  it("writes atomically and rejects a newer mtime", async () => {
    const path = join(await temp(), "画布.excalidraw");
    const first = await writeFileAtomic(path, new TextEncoder().encode("one"));
    await expect(
      writeFileAtomic(path, new TextEncoder().encode("two"), first.mtime - 1),
    ).rejects.toMatchObject({ code: "Conflict" });
    expect(await readFile(path, "utf8")).toBe("one");
  });
  it("returns null for a missing file", async () => {
    expect(await fileStat(join(await temp(), "missing"))).toBeNull();
  });
  it("filters names and limits recursion to three levels", async () => {
    const dir = await temp();
    await writeFile(join(dir, "a.excalidraw"), "{}");
    await writeFile(join(dir, "b.excalidraw.png"), "png");
    await writeFile(join(dir, "c.excalidraw.svg"), "svg");
    await writeFile(join(dir, "plain.png"), "png");
    await mkdir(join(dir, ".hidden"));
    await writeFile(join(dir, ".hidden", "hidden.excalidraw"), "{}");
    await mkdir(join(dir, "node_modules"));
    await writeFile(join(dir, "node_modules", "ignored.excalidraw"), "{}");
    let nested = dir;
    for (let i = 0; i < 4; i++) {
      nested = join(nested, "level");
      await mkdir(nested);
      await writeFile(join(nested, `${i}.excalidraw`), "{}");
    }
    const entries = await listSceneFiles(dir);
    expect(entries.map((entry) => entry.kind).sort()).toEqual([
      "excalidraw",
      "excalidraw",
      "excalidraw",
      "excalidraw",
      "png",
      "svg",
    ]);
  });
  it("skips unreadable child directories", async () => {
    const dir = await temp();
    const blocked = join(dir, "blocked");
    await mkdir(blocked);
    await writeFile(join(dir, "visible.excalidraw"), "{}");
    const { readdir } = await import("node:fs/promises");
    const reader: typeof readdir = ((path: string, options: { withFileTypes: true }) =>
      path === blocked
        ? Promise.reject(new Error("permission denied"))
        : readdir(path, options)) as typeof readdir;
    expect((await listSceneFiles(dir, reader)).map((entry) => entry.name)).toEqual([
      "visible.excalidraw",
    ]);
  });
  it("caps results at 500", async () => {
    const dir = await temp();
    await Promise.all(
      Array.from({ length: 510 }, (_, i) => writeFile(join(dir, `${i}.excalidraw`), "{}")),
    );
    expect(await listSceneFiles(dir)).toHaveLength(500);
  });
  it("rejects rename to an existing destination", async () => {
    const dir = await temp();
    const from = join(dir, "from.excalidraw");
    const to = join(dir, "to.excalidraw");
    await writeFile(from, "from");
    await writeFile(to, "to");
    await expect(renameSceneFile(from, to)).rejects.toMatchObject({ code: "Exists" });
    expect(await readFile(to, "utf8")).toBe("to");
  });
});

import { mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type FileError = { code: "Conflict" | "Exists" | "Io"; message: string };
export type FileEntry = {
  path: string;
  name: string;
  mtime: number;
  size: number;
  kind: "excalidraw" | "png" | "svg" | "markdown";
};

function io(error: unknown): FileError {
  return { code: "Io", message: error instanceof Error ? error.message : String(error) };
}

export async function fileStat(path: string): Promise<{ mtime: number; size: number } | null> {
  try {
    const value = await stat(path);
    return { mtime: value.mtimeMs, size: value.size };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw io(error);
  }
}

export async function readSceneFile(path: string): Promise<Uint8Array> {
  try {
    return await readFile(path);
  } catch (error) {
    throw io(error);
  }
}

export async function writeFileAtomic(path: string, bytes: Uint8Array, expectedMtime?: number) {
  if (expectedMtime !== undefined) {
    const current = await fileStat(path);
    if (current && current.mtime > expectedMtime)
      throw { code: "Conflict", message: "文件已在别处修改" } satisfies FileError;
  }
  const folder = dirname(path);
  if (/[/\\]assets[/\\][^/\\]+[/\\][^/\\]+$/.test(path)) await mkdir(folder, { recursive: true });
  const temp = join(folder, `.folio-${process.pid}-${randomUUID()}.tmp`);
  try {
    const handle = await open(temp, "wx");
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, path);
    try {
      const directory = await open(folder, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    } catch {
      // Some filesystems do not allow directory fsync.
    }
    const result = await fileStat(path);
    if (!result) throw new Error("写入后文件不存在");
    return { mtime: result.mtime };
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw (error as FileError).code ? error : io(error);
  }
}

export async function listDocuments(
  dir: string,
  readDirectory: typeof readdir = readdir,
): Promise<FileEntry[]> {
  const result: FileEntry[] = [];
  const pending: { folder: string; depth: number }[] = [{ folder: dir, depth: 0 }];
  while (pending.length) {
    const { folder, depth } = pending.pop()!;
    let entries;
    try {
      entries = await readDirectory(folder, { withFileTypes: true });
    } catch (error) {
      if (depth === 0) throw io(error);
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        if (depth < 3) pending.push({ folder: path, depth: depth + 1 });
        continue;
      }
      const lower = entry.name.toLowerCase();
      const kind =
        lower.endsWith(".md") || lower.endsWith(".markdown")
          ? "markdown"
          : lower.endsWith(".excalidraw")
            ? "excalidraw"
            : lower.endsWith(".excalidraw.png")
              ? "png"
              : lower.endsWith(".excalidraw.svg")
                ? "svg"
                : null;
      if (!kind) continue;
      try {
        const info = await fileStat(path);
        if (info) result.push({ path, name: basename(path), ...info, kind });
      } catch {
        continue;
      }
      if (result.length === 500) return result;
    }
  }
  return result;
}

export const listSceneFiles = listDocuments;

export async function renameSceneFile(from: string, to: string) {
  if (await fileStat(to)) throw { code: "Exists", message: "目标文件已存在" } satisfies FileError;
  try {
    await rename(from, to);
  } catch (error) {
    throw io(error);
  }
}

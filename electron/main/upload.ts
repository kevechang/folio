import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { statSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";
import { app } from "electron";

export type UploadConfig = { storage: "picgo"; url: string } | { storage: "upic"; path: string };

const extensions = new Set(["png", "jpg", "gif", "webp", "avif"]);

export function validatePicgoUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PicGo 服务地址无效");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("PicGo 只允许本机 HTTP 服务");
  return url.href.replace(/\/$/, "");
}

export function parsePicgoResponse(value: unknown): string {
  if (!value || typeof value !== "object") throw new Error("PicGo 返回格式无效");
  const response = value as { success?: unknown; result?: unknown; message?: unknown };
  if (response.success !== true) {
    throw new Error(typeof response.message === "string" ? response.message : "PicGo 上传失败");
  }
  const result = Array.isArray(response.result) ? response.result[0] : null;
  if (typeof result !== "string" || !/^https?:\/\//i.test(result))
    throw new Error("PicGo 未返回有效图片地址");
  return result;
}

export function validateUpicPath(path: string): string {
  let isFile = false;
  try {
    isFile = statSync(path).isFile();
  } catch {
    // An absent executable is reported as an invalid path below.
  }
  if (!isAbsolute(path) || basename(path) !== "uPic" || !isFile) throw new Error("uPic 路径无效");
  return path;
}

export function parseUpicOutput(stdout: string): string {
  const last = stdout.trim().split(/\r?\n/).at(-1)?.trim() ?? "";
  if (!/^https?:\/\//i.test(last)) throw new Error("uPic 未返回有效图片地址");
  return last;
}

export async function uploadImage(
  bytes: Uint8Array,
  ext: string,
  config: UploadConfig,
): Promise<string> {
  if (!config || (config.storage !== "picgo" && config.storage !== "upic"))
    throw new Error("不支持的图片保存方式");
  if (!extensions.has(ext)) throw new Error("不支持的图片类型");
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > 50 * 1024 * 1024)
    throw new Error("图片不能超过 50MB");
  const target =
    config.storage === "picgo" ? validatePicgoUrl(config.url) : validateUpicPath(config.path);
  const directory = join(app.getPath("temp"), "folio-upload");
  await mkdir(directory, { recursive: true });
  const temporary = join(directory, `${randomUUID()}.${ext}`);
  try {
    await writeFile(temporary, bytes);
    if (config.storage === "upic") {
      const stdout = await new Promise<string>((resolve, reject) => {
        execFile(
          target,
          ["-o", "url", "-u", temporary],
          {
            timeout: 30000,
            shell: false,
          },
          (error, output) => (error ? reject(error) : resolve(output)),
        );
      });
      return parseUpicOutput(stdout);
    }
    const response = await fetch(`${target}/upload`, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list: [temporary] }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`PicGo 服务返回 ${response.status}`);
    return parsePicgoResponse(await response.json());
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

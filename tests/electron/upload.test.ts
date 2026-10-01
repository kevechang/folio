import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { execFile, temp } = vi.hoisted(() => ({
  execFile: vi.fn(),
  temp: `/tmp/folio-upload-test-${process.pid}`,
}));
await mkdir(temp, { recursive: true });
vi.mock("electron", () => ({ app: { getPath: () => temp } }));
vi.mock("node:child_process", () => ({ execFile }));
import {
  parsePicgoResponse,
  parseUpicOutput,
  uploadImage,
  validatePicgoUrl,
  validateUpicPath,
} from "../../electron/main/upload";

beforeEach(() => {
  execFile.mockReset();
  vi.unstubAllGlobals();
});

describe("upload", () => {
  it("parses PicGo success and readable failures", () => {
    expect(parsePicgoResponse({ success: true, result: ["https://img.test/a.png"] })).toBe(
      "https://img.test/a.png",
    );
    expect(() => parsePicgoResponse({ success: false, message: "服务未启动" })).toThrow(
      "服务未启动",
    );
    expect(() => parsePicgoResponse({ success: true, result: [] })).toThrow("有效图片地址");
    expect(() => parsePicgoResponse(null)).toThrow("格式无效");
  });
  it("accepts only local HTTP PicGo URLs", () => {
    expect(validatePicgoUrl("http://127.0.0.1:36677")).toBe("http://127.0.0.1:36677");
    expect(validatePicgoUrl("http://[::1]:36677")).toBe("http://[::1]:36677");
    expect(() => validatePicgoUrl("https://example.com")).toThrow();
    expect(() => validatePicgoUrl("file:///tmp/x")).toThrow();
  });
  it("parses only the last nonempty uPic output line", () => {
    expect(parseUpicOutput("working\nhttps://img.test/a.png\n\n")).toBe("https://img.test/a.png");
    expect(() => parseUpicOutput("https://img.test/a.png\nfailed")).toThrow();
  });
  it("validates uPic paths", async () => {
    const valid = join(temp, "uPic");
    await writeFile(valid, "");
    expect(validateUpicPath(valid)).toBe(valid);
    expect(() => validateUpicPath("uPic")).toThrow();
    expect(() => validateUpicPath(join(temp, "other"))).toThrow();
    const directory = join(temp, "nested", "uPic");
    await mkdir(directory, { recursive: true });
    expect(() => validateUpicPath(directory)).toThrow();
  });
  it("deletes temporary files after PicGo success and failure", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, result: ["https://img.test/a.png"] }),
      })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", request);
    const config = { storage: "picgo" as const, url: "http://localhost:36677" };
    await expect(uploadImage(new Uint8Array([1]), "png", config)).resolves.toBe(
      "https://img.test/a.png",
    );
    expect(await readdir(join(temp, "folio-upload"))).toEqual([]);
    await expect(uploadImage(new Uint8Array([1]), "png", config)).rejects.toThrow("offline");
    expect(await readdir(join(temp, "folio-upload"))).toEqual([]);
  });
  it("calls uPic with fixed arguments and no shell, then deletes the file", async () => {
    const path = join(temp, "uPic");
    await writeFile(path, "");
    execFile.mockImplementation((_path, _args, _options, callback) =>
      callback(null, "progress\nhttps://img.test/a.png\n", ""),
    );
    await expect(uploadImage(new Uint8Array([1]), "jpg", { storage: "upic", path })).resolves.toBe(
      "https://img.test/a.png",
    );
    const [calledPath, args, options] = execFile.mock.calls[0];
    expect(calledPath).toBe(path);
    expect(args.slice(0, 3)).toEqual(["-o", "url", "-u"]);
    expect(options).toMatchObject({ shell: false, timeout: 30000 });
    expect(await readdir(join(temp, "folio-upload"))).toEqual([]);
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { inlineLocalImages } from "../src/features/markdown/export/assets";
import { platform } from "../src/lib/platform";

afterEach(() => vi.restoreAllMocks());

function article(html: string) {
  const root = document.createElement("article");
  root.innerHTML = html;
  return root;
}

describe("inlineLocalImages", () => {
  it.each(["html", "pdf"] as const)(
    "%s omits denied and unreadable images, counts them and continues with allowed images",
    async (format) => {
      const readFile = vi.spyOn(platform, "readFile");
      const readAsset = vi.spyOn(platform, "readAsset").mockImplementation(async (path) => {
        if (path === "/docs/allowed.png") return new Uint8Array([1, 2, 3]);
        if (path === "/docs/unreadable.png") throw new Error("Denied");
        return null;
      });
      const root = article(
        '<img src="folio-asset://local/private.png" alt="denied">' +
          '<img src="folio-asset://local/docs/unreadable.png" alt="unreadable">' +
          '<img src="folio-asset://local/docs/allowed.png">' +
          '<img src="https://example.test/remote.png">',
      );
      const result = await inlineLocalImages(root, `/exports/a.${format}`, { format });
      expect(result).toEqual({ imagesKept: false, hasLargeImages: false, rejectedImages: 2 });
      const images = root.querySelectorAll("img");
      expect(images[0].hasAttribute("src")).toBe(false);
      expect(images[1].hasAttribute("src")).toBe(false);
      expect(images[0].alt).toBe("denied");
      expect(images[2].getAttribute("src")).toBe("data:image/png;base64,AQID");
      expect(images[3].getAttribute("src")).toBe("https://example.test/remote.png");
      expect(readAsset).toHaveBeenCalledTimes(3);
      expect(readFile).not.toHaveBeenCalled();
    },
  );

  it("omits malformed local URLs without interrupting export", async () => {
    const readAsset = vi.spyOn(platform, "readAsset");
    const root = article('<img src="folio-asset://local/docs/%ZZ.png">');
    expect((await inlineLocalImages(root, null)).rejectedImages).toBe(1);
    expect(root.querySelector("img")?.hasAttribute("src")).toBe(false);
    expect(readAsset).not.toHaveBeenCalled();
  });

  it("uses the final HTML directory when the combined image size exceeds the limit", async () => {
    vi.spyOn(platform, "readAsset").mockResolvedValue(new Uint8Array(9));
    const root = article(
      '<img src="folio-asset://local/docs/assets/a.png"><img src="folio-asset://local/docs/assets/b.png">',
    );
    const result = await inlineLocalImages(root, "/exports/site/a.html", {
      format: "html",
      limit: 16,
    });
    expect(result).toEqual({ imagesKept: true, hasLargeImages: false, rejectedImages: 0 });
    expect(root.querySelectorAll("img")[0].getAttribute("src")).toBe("../../docs/assets/a.png");
    expect(root.querySelectorAll("img")[1].getAttribute("src")).toBe("../../docs/assets/b.png");
  });

  it("always inlines PDF images, ignoring a supplied size limit", async () => {
    const bytes = new Uint8Array(17).fill(1);
    vi.spyOn(platform, "readAsset").mockResolvedValue(bytes);
    const root = article('<img src="folio-asset://local/docs/a.png">');
    const result = await inlineLocalImages(root, "/exports/a.pdf", { format: "pdf", limit: 0 });
    const src = root.querySelector("img")!.getAttribute("src")!;
    expect(src.startsWith("data:image/png;base64,")).toBe(true);
    expect(Array.from(atob(src.split(",")[1]), (character) => character.charCodeAt(0))).toEqual(
      Array.from(bytes),
    );
    expect(result).toEqual({ imagesKept: false, hasLargeImages: false, rejectedImages: 0 });
  });
});
